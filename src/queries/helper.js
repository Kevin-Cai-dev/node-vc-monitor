const Server = require("../models/server");
const VC = require("../models/vc");
const User = require("../models/user");

const addNewChannel = async (vcID, guild) => {
  let server;
  try {
    server = await Server.findOne({ serverID: guild.id });
  } catch (e) {
    console.error(e);
  }

  addChannelToDb(vcID, server, guild.id);
};

// Adds voice channel to database, adds reference to parent server
const addChannelToDb = async (vcID, server, guildId) => {
  const newVC = new VC({ vcID, owner: server });
  const autosubs = await User.find({ server: server._id, auto: true });
  const subIDs = autosubs.map((user) => user._id);
  newVC.subs = subIDs;
  newVC.save(async () => {
    try {
      await Server.updateOne(
        { serverID: guildId },
        { $push: { voiceChannels: newVC } }
      );
    } catch (e) {
      console.error(e);
    }
  });
};

// add server and voice channels to database
const saveServerToDb = async (guild) => {
  // create new server document
  const server = new Server({ serverID: guild.id });
  await server.save();

  // loop through all voice channels, save them and add references
  const voicechannels = guild.channels.cache
    .array()
    .filter((voice) => voice.type === "voice");
  voicechannels.forEach((channel) => {
    addChannelToDb(channel.id, server, guild.id);
  });

  const users = await guild.members.fetch();
  // loop through all users in server, save them and add references
  addUsers(users.array(), server);
};

// remove server and children channels from database
const deleteServerFromDb = async (ids) => {
  try {
    await Server.deleteOne({ serverID: { $in: ids } });
  } catch (e) {
    console.error(e);
  }
};

// find VC document before removing
const findAndDeleteChannel = async (channel) => {
  const serverID = channel.guild.id;
  const del = await VC.findOne({ vcID: channel.id });
  deleteChannelFromDb(serverID, del);
};

// users is an array of user objects from DiscordAPI to add, server is a
// document representing the guild which the users belong to
const addUsers = async (users, server) => {
  // loop through all users in current server
  users.forEach(async (user) => {
    if (user.user.bot) {
      return;
    } else {
      addNewUser(user, server);
    }
  });
};

// function to create new user document if not found
const addNewUser = async (user, server) => {
  const check = await User.findOne({ userID: user.id, server: server._id });
  if (check) {
    return console.log("User already exists in this server!");
  }
  const newUser = new User({ userID: user.id, server });
  await newUser.save(async () => {
    await Server.updateOne(
      { serverID: server.serverID },
      { $push: { users: newUser } }
    );
  });
};

// remove channel from database along with reference
const deleteChannelFromDb = async (serverID, del) => {
  try {
    await Server.updateOne({ serverID }, { $pull: { voiceChannels: del._id } });
    await del.remove();
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  addNewChannel,
  addChannelToDb,
  saveServerToDb,
  deleteServerFromDb,
  findAndDeleteChannel,
  addUsers,
  addNewUser,
  deleteChannelFromDb,
};
