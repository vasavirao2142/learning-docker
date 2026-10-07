const express = require("express");

const router = express.Router();
const { userModel } = require("../models/users");

router.get("/allusers", async (req, res) => {
  try {
    const users = await userModel.find();
    res.json({
      data: users,
      error: "",
    });
  } catch (error) {
    res.status(500).json({
      error: `something went wrong ,${error.message}`,
      data: [],
    });
  }
});

router.post("/user", async (req, res) => {
  try {
    console.log("executing");
    const { username, password } = req.body;
    const user = await userModel.create({
      username: username,
      password: password,
    });
    res.status(201).json({
      message: "user created successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: `something went wrong ,${error.message}`,
      data: [],
    });
  }
});

module.exports = router;
