const Server = require("../../models/server");
const VC = require("../../models/vc");
const User = require("../../models/user");

module.exports = {
  name: "suball",
  description:
    "Command to subscribe to all available voice channels in the server",
  guildOnly: true,
  aliases: ["sall", "sa"],
  async execute(message, args, callback) {
    const guild = message.guild;
    const member = message.member;

    const server = await Server.findOne({ serverID: guild.id }).populate(
      "voiceChannels"
    );
    const user = await User.findOne({ userID: member.id, server: server._id });
    // extract all voice channels in server
    // const vcAll = guild.channels.cache.filter(
    //   (channel) => channel.type === "voice"
    // );
    const response = "Successfully subscribed to all available channels!";

    const voiceChannels = server.voiceChannels;

    voiceChannels.forEach(async (channel) => {
      if (channel.restricted) {
        return;
      }
      const exists = channel.subs.some((uid) => uid === user._id);
      const discChannel = guild.channels.cache.get(channel.vcID);
      if (!exists && discChannel.permissionsFor(member).has("VIEW_CHANNEL")) {
        await VC.updateOne({ vcID: channel.vcID }, { $push: { subs: user } });
      }
    });

    callback(undefined, response);
  },
};
