require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.json({
    message: "System is working fine",
  });
});

app.listen(PORT, () => {
  console.log("server started successfully");
});
