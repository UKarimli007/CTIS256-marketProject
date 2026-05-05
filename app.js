const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();

const db = require("./db");

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "ctis256-secret",
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");

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

    try {
        const [existingUser] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.render("auth/register", {
                error: "This email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let fullName = null;
        let marketName = null;

        if (role === "consumer") {
            fullName = name;
        } else if (role === "market") {
            marketName = name;
        }

        await db.query(
            `INSERT INTO users 
            (email, password_hash, role, is_verified, full_name, market_name, city, district)
            VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
            [email, hashedPassword, role, fullName, marketName, city, district]
        );

        res.redirect("/auth/login");

    } catch (err) {
        console.error(err);
        res.render("auth/register", {
            error: "Error registering user"
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

app.get("/profile", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    res.send(`Welcome ${req.session.user.email}`);
});

app.get("/market-dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    if (req.session.user.role !== "market") {
        return res.send("Access denied");
    }

    res.send(`Welcome market user: ${req.session.user.email}`);
});

app.get("/auth/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});