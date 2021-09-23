const VC = require("../models/vc");

// send ping to all subscribed members
const pingUsers = async (guild, newChannel, member, recentDM) => {
  let voiceChannel;
  try {
    voiceChannel = await VC.findOne({ vcID: newChannel.id }).populate("subs");
  } catch (e) {
    console.error(e);
  }

  if (!voiceChannel) {
    return console.error("Could not read voice channel data!");
  }
  if (voiceChannel.restricted) {
    return console.log(`Channel ${newChannel.id} is restricted!`);
  }

  let allMembers = undefined;
  try {
    allMembers = await guild.members.fetch();
  } catch (e) {
    return console.error(e);
  }

  if (!allMembers) {
    return console.log("allMembers is undefined!");
  }

  voiceChannel.subs.forEach((user) => {
    if (member.id !== user.userID) {
      const receiver = allMembers.get(user.userID);
      if (!receiver) {
        return console.log("no receiver found!");
      }
      if (recentDM.has(receiver.id)) {
        return;
      }
      try {
        console.log(receiver.user.username);
        receiver.send(
          `${receiver}, ${member.displayName} joined the voice channel ${newChannel.name} in server \'${guild.name}\'!`
        );
        recentDM.add(receiver.id);
        setTimeout(() => {
          recentDM.delete(receiver.id);
        }, 20000);
      } catch (error) {
        console.error(error);
      }
    }
  });
};

module.exports = pingUsers;
