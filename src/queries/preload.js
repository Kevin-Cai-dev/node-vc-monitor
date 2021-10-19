const Server = require("../models/server");
const {
  deleteChannelFromDb,
  addChannelToDb,
  addUsers,
  saveServerToDb,
} = require("./helper");

// update database upon launching
const updateDatabase = async (client) => {
  const guilds = client.guilds.cache.array();
  const guildIds = guilds.map((server) => server.id);
  // delete guilds which the bot is no longer part of
  await Server.deleteMany({ serverID: { $nin: guildIds } });

  // get all saved servers in database
  let saved;
  try {
    // need to populate user field as well

    saved = await Server.find({ serverID: { $in: guildIds } })
      .populate("voiceChannels")
      .populate("users");
  } catch (e) {
    console.error(e);
  }

  // extract all ids of saved servers
  let savedServerIds = [];
  if (saved) {
    savedServerIds = saved.map((server) => server.serverID);
  }

  // get all servers which are currently tracked in database
  const currentServers = guilds.filter((server) =>
    savedServerIds.includes(server.id)
  );
  // get all servers which are not currently tracked in database
  const newServers = guilds.filter(
    (server) => !savedServerIds.includes(server.id)
  );

  // guaranteed to match up to an existing server since redundant entries have
  // been deleted previously
  saved.forEach(async (server) => {
    const serverID = server.serverID;
    const serverData = currentServers.find((s) => s.id === serverID);

    // get ids for all voice channels in server from Discord API
    const voiceChannelIds = currentServers
      .find((s) => s.id === serverID)
      .channels.cache.array()
      .filter((voice) => voice.type === "voice")
      .map((vc) => vc.id);

    // get all VC documents from database
    const currentVC = server.voiceChannels;

    // filter out documents which no longer match up to a valid voice channel
    const toDelete = currentVC.filter(
      (id) => !voiceChannelIds.includes(id.vcID)
    );

    // filter out IDs of new channels which must be added to database
    const toAdd = voiceChannelIds.filter(
      (id) => !currentVC.map((vc) => vc.vcID).includes(id)
    );

    // delete invalid VC documents and update server reference
    toDelete.forEach(async (del) => {
      deleteChannelFromDb(serverID, del);
    });

    // create new VC documents for new channels
    toAdd.forEach(async (add) => {
      addChannelToDb(add, server, serverID);
    });

    // get all users currently in server via DiscordAPI
    const users = await serverData.members.fetch();

    const userIDs = users.array().map((user) => user.user.id);

    // get all User documents from database matching current server
    const userDocs = server.users;
    const userDocIDs = userDocs.map((user) => user.userID);
    // filter out documents which no longer match up to a present user
    const usersToDelete = userDocs.filter(
      (user) => !userIDs.includes(user.userID)
    );

    // find users which are not stored in the current servers reference of users
    const usersToAdd = users.filter((user) => !userDocIDs.includes(user.id));
    // call deleteMany on usersToDelete
    usersToDelete.forEach(async (user) => {
      await Server.updateOne(
        { _id: user.server },
        { $pull: { users: user._id } }
      );
      await VC.updateMany(
        { owner: user.server },
        { $pull: { subs: user._id } }
      );
      await User.deleteOne({ _id: user._id });
    });
    addUsers(usersToAdd, server);
  });

  // Add new servers to database alongside their voice channels
  newServers.forEach((guild) => {
    saveServerToDb(guild);
  });
};

module.exports = updateDatabase;
