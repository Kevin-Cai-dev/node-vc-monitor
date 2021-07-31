const stringSimilarity = require("string-similarity");
const Server = require("../../models/server");
const VC = require("../../models/vc");

module.exports = {
  name: "subscribe",
  description: "Command to subscribe to one or more voice channels",
  args: true,
  usage: "<channelName1, channelName2, ...>",
  guildOnly: true,
  aliases: ["sub", "s"],
  async execute(message, args, callback) {
    const guild = message.guild;
    const member = message.member;

    const server = await Server.findOne({ serverID: guild.id }).populate(
      "voiceChannels"
    );
    // extract all voice channels in server
    const vcAll = guild.channels.cache.filter(
      (channel) => channel.type === "voice"
    );
    const vcNames = vcAll.map((vc) => vc.name.toLowerCase());
    let error = "Could not find channel(s): ";
    let response = "Successfully subscribed!";

    // 'all' arg specified, attempting to subscribe to all voice channels
    // if (args[0] === "all" && args.length === 1) {
    //   const voiceChannels = server.voiceChannels;

    //   voiceChannels.forEach(async (channel) => {
    //     const exists = channel.subs.some((uid) => uid === member.id);
    //     const discChannel = guild.channels.cache.get(channel.vcID);
    //     if (!exists && discChannel.permissionsFor(member).has("VIEW_CHANNEL")) {
    //       await VC.updateOne(
    //         { vcID: channel.vcID },
    //         { $push: { subs: member.id } }
    //       );
    //     }
    //   });
    // }
    // attempt to subscribe to all specified channel names
    // else {
    for (let i = 0; i < args.length; i++) {
      args[i] = args[i].trim();

      // finding the best matching voice channel name based on args
      const { bestMatch } = stringSimilarity.findBestMatch(args[i], vcNames);

      if (bestMatch.rating < 0.1) {
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

      const exists = voiceChannelData.subs.some((uid) => uid === member.id);

      if (!exists) {
        if (vc.permissionsFor(member).has("VIEW_CHANNEL")) {
          voiceChannelData.subs.push(member.id);
          await voiceChannelData.save();
        } else {
          error += `${args[i]},`;
        }
      }
    }
    // }

    const lastChar = error.charAt(error.length - 1);
    error = error.slice(0, -1);
    if (lastChar === " ") {
      callback(undefined, response);
    } else {
      callback(error);
    }
  },
};
