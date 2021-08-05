const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  auto: {
    type: Boolean,
    required: true,
    default: false,
  },
  count: {
    type: Number,
    required: true,
    default: 1,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
