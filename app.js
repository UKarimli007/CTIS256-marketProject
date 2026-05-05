const express = require("express");
const app = express();

const db = require("./db");

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.send(`Database working: ${rows[0].result}`);
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});