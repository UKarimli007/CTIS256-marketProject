const express = require("express");
const app = express();

const db = require("./db");

app.use(express.urlencoded({ extended: true }));

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
    const email = req.body.username;
    const password = req.body.password;

    try {
        await db.query(
            "INSERT INTO users (email, password_hash, is_verified, role) VALUES (?, ?, 0, 'consumer')",
            [email, password]
        );

        res.send("User registered successfully");
    } catch (err) {
        console.error(err);
        res.send("Error registering user");
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
})