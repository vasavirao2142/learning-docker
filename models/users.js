const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 10,
    unique: true,
  },
  password: {
    type: String,
    minLength: 6,
    maxLength: 10,
    required: true,
  },
});

const userModel = mongoose.model("users", userSchema);

module.exports = { userModel };
