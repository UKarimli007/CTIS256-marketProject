require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

const app = express();
const db = require("./db");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "ctis256-secret",
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 + 1 AS result");
        res.send(`Database working: ${rows[0].result}`);
    } catch (err) {
        console.error(err);
        res.send("Database error");
    }
});

app.get("/auth/register", (req, res) => {
    res.render("auth/register");
});

app.post("/auth/register", async (req, res) => {
    const role = req.body.role;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const city = req.body.city;
    const district = req.body.district;

    const form = { role, name, email, city, district };

    try {
        if (!role || !name || !email || !password || !city || !district) {
            return res.render("auth/register", {
                error: "Please fill in all fields",
                form: form
            });
        }

        if (password.length < 4) {
            return res.render("auth/register", {
                error: "Password must be at least 4 characters",
                form: form
            });
        }

        const [existingUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.render("auth/register", {
                error: "This email is already registered",
                form: form
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        let fullName = null;
        let marketName = null;

        if (role === "consumer") {
            fullName = name;
        } else {
            marketName = name;
        }

        await db.query(
            `INSERT INTO users 
            (email, password_hash, role, is_verified, full_name, market_name, city, district, verification_code)
            VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, role, fullName, marketName, city, district, code]
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification Code",
            text: `Your verification code is: ${code}`
        });

        res.render("auth/verify", {
            email: email,
            message: "Verification code was sent to your email"
        });

    } catch (err) {
        console.error(err);
        res.render("auth/register", {
            error: "Error registering user",
            form: form
        });
    }
});

app.get("/auth/verify", (req, res) => {
    res.render("auth/verify");
});

app.post("/auth/verify", async (req, res) => {
    const email = req.body.email;
    const code = req.body.code;

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? AND verification_code = ?",
            [email, code]
        );

        if (rows.length === 0) {
            return res.render("auth/verify", {
                email: email,
                error: "Invalid verification code"
            });
        }

        await db.query(
            "UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?",
            [email]
        );

        res.redirect("/auth/login");

    } catch (err) {
        console.error(err);
        res.render("auth/verify", {
            email: email,
            error: "Error verifying email"
        });
    }
});

app.get("/auth/login", (req, res) => {
    res.render("auth/login");
});

app.post("/auth/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.render("auth/login", {
                error: "Invalid email or password"
            });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.render("auth/login", {
                error: "Invalid email or password"
            });
        }

        if (user.is_verified === 0) {
            return res.render("auth/verify", {
                email: user.email,
                error: "Please verify your email first"
            });
        }

        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        if (user.role === "market") {
            res.redirect("/market-dashboard");
        } else {
            res.redirect("/profile");
        }

    } catch (err) {
        console.error(err);
        res.render("auth/login", {
            error: "Error logging in"
        });
    }
});

app.get("/products", async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT products.*, users.market_name, users.city, users.district
             FROM products
             JOIN users ON products.market_id = users.id
             WHERE products.expiration_date >= CURDATE()
             ORDER BY products.expiration_date ASC`
        );

        res.render("products/index", {
            products: products
        });

    } catch (err) {
        console.error(err);
        res.send("Error loading products");
    }
});

app.get("/products/:id", async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT products.*, users.market_name, users.city, users.district
             FROM products
             JOIN users ON products.market_id = users.id
             WHERE products.id = ?`,
            [productId]
        );

        if (rows.length === 0) {
            return res.send("Product not found");
        }

        res.render("products/detail", {
            product: rows[0]
        });

    } catch (err) {
        console.error(err);
        res.send("Error loading product details");
    }
});

app.get("/market/products/add", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    if (req.session.user.role !== "market") {
        return res.send("Access denied");
    }

    res.render("products/add", {
        error: null,
        form: {}
    });
});

app.post("/market/products/add", upload.single("image"), async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    if (req.session.user.role !== "market") {
        return res.send("Access denied");
    }

    const title = req.body.title;
    const stock = req.body.stock;
    const normalPrice = req.body.normal_price;
    const discountedPrice = req.body.discounted_price;
    const expirationDate = req.body.expiration_date;
    const image = req.file ? req.file.filename : null;

    const form = {
        title,
        stock,
        normal_price: normalPrice,
        discounted_price: discountedPrice,
        expiration_date: expirationDate
    };

    try {
        if (!title || !stock || !normalPrice || !discountedPrice || !expirationDate) {
            return res.render("products/add", {
                error: "Please fill in all required fields",
                form: form
            });
        }

        await db.query(
            `INSERT INTO products 
            (market_id, title, stock, normal_price, discounted_price, expiration_date, image)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user.id,
                title,
                stock,
                normalPrice,
                discountedPrice,
                expirationDate,
                image
            ]
        );

        res.redirect("/products");

    } catch (err) {
        console.error(err);
        res.render("products/add", {
            error: "Error adding product",
            form: form
        });
    }
});

app.get("/profile", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    res.send(`Welcome ${req.session.user.email}<br><br><a href="/products">View Products</a>`);
});

app.get("/market-dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    if (req.session.user.role !== "market") {
        return res.send("Access denied");
    }

    res.send(`
        Welcome market user: ${req.session.user.email}
        <br><br>
        <a href="/products">View Products</a>
        <br>
        <a href="/market/products/add">Add Product</a>
    `);
});

app.get("/auth/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});