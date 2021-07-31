const Server = require("../../models/server");
const VC = require("../../models/vc");

module.exports = {
  name: "unsuball",
  description: "command to unsubscribe from all currently subscribed channels",
  guildOnly: true,
  aliases: ["usall", "ua"],
  async execute(message, args, callback) {
    const guild = message.guild;
    const member = message.member;
    const server = await Server.findOne({ serverID: guild.id }).populate(
      "voiceChannels"
    );

    let response = "Unsubscribed from all channels successfully!";

    const voiceChannels = server.voiceChannels;
    voiceChannels.forEach(async (channel) => {
      await VC.updateOne(
        { vcID: channel.vcID },
        { $pull: { subs: member.id } }
      );
    });

    callback(undefined, response);
  },
};
