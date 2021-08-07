const stringSimilarity = require("string-similarity");
const VC = require("../../models/vc");

module.exports = {
  name: "unblock",
  description: "Release restrictions on subscriptions to one or more channels",
  guildOnly: true,
  args: true,
  usage: "<channelName1, channelName2, ...>",
  aliases: ["ubl"],
  permissions: "MANAGE_GUILD",
  async execute(message, args, callback) {
    const guild = message.guild;

    const vcAll = guild.channels.cache.filter(
      (channel) => channel.type === "voice"
    );
    const vcNames = vcAll.map((vc) => vc.name.toLowerCase());
    let error = "Could not find channel(s): ";
    let response = "Updated all restriction flag(s) to `FALSE` successfully!";
    for (let i = 0; i < args.length; i++) {
      args[i] = args[i].trim();

      // finding the best matching voice channel name based on args
      const { bestMatch } = stringSimilarity.findBestMatch(args[i], vcNames);

      if (bestMatch.rating < 0.5) {
        error += `${args[i]},`;
        continue;
      }

      // finding voice channel
      const vc = vcAll.find(
        (channel) => channel.name.toLowerCase() === bestMatch.target
      );
      if (!vc) {
        error += `${args[i]},`;
        continue;
      }

      const voiceChannelData = await VC.findOne({ vcID: vc.id });
      if (!voiceChannelData) {
        error += `${args[i]},`;
        continue;
      }
      voiceChannelData.restricted = false;
      await voiceChannelData.save();
    }

    const lastChar = error.charAt(error.length - 1);
    error = error.slice(0, -1);
    if (lastChar === " ") {
      callback(undefined, response);
    } else {
      callback(error);
    }
  },
};
