const Server = require("../../models/server");
const VC = require("../../models/vc");
const User = require("../../models/user");

module.exports = {
  name: "unsuball",
  description: "command to unsubscribe from all currently subscribed channels",
  guildOnly: true,
  aliases: ["usall", "ua"],
  async execute(message, args, callback) {
    const guild = message.guild;
    const member = message.member;
    // retrieve server and user docs from db
    const server = await Server.findOne({ serverID: guild.id }).populate(
      "voiceChannels"
    );
    const user = await User.findOne({
      userID: member.id,
      server: server._id,
    });
    let response = "Unsubscribed from all channels successfully!";
    // remove user from all channels in server
    const voiceChannels = server.voiceChannels;
    voiceChannels.forEach(async (channel) => {
      await VC.updateOne({ vcID: channel.vcID }, { $pull: { subs: user._id } });
    });

    callback(undefined, response);
  },
};
