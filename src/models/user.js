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
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
