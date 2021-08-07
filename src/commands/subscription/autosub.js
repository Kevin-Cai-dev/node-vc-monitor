const Server = require("../../models/server");
const User = require("../../models/user");

module.exports = {
  name: "autosub",
  description: "Toggle flag to automatically subscribe to new voice channels",
  guildOnly: true,
  aliases: ["as"],
  async execute(message, args, callback) {
    let state;
    const guild = message.guild;
    const member = message.member;
    let server;
    let user;
    // get server and user docs from db
    try {
      server = await Server.findOne({ serverID: guild.id });
      user = await User.findOne({
        userID: member.id,
        server: server._id,
      });
    } catch (e) {
      console.error(e);
    }

    if (!server || !user) {
      console.log("Could not find either server or user for autosub!");
      return callback("Autosub failed!");
    }
    // toggle auto flag for user and save
    user.auto = !user.auto;
    if (user.auto) {
      state = "on";
    } else {
      state = "off";
    }
    await user.save();

    callback(undefined, `Turned ${state} autosub!`);
  },
};
