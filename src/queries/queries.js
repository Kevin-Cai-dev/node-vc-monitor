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
  const savedServerIds = saved.map((server) => server.serverID);

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

// process command and execute matching command
const handleCommand = async (client, message) => {
  let sPrefix = undefined;
  let server = undefined;
  const guild = message.guild;
  if (!guild.available) {
    return;
  }

  // message was from dm, use default prefix
  if (!guild) {
    sPrefix = process.env.PREFIX;
  } else {
    try {
      server = await Server.findOne({ serverID: guild.id });
    } catch (e) {
      console.error(e);
    }

    if (!server) {
      return;
    }
    sPrefix = server.prefix;
  }

  // message does not start with prefix
  if (!message.content.startsWith(sPrefix)) {
    return;
  }

  // split up command args on whitespaces
  const msg = message.content.slice(sPrefix.length);
  let len = msg.length;
  if (msg.indexOf(" ") !== -1) {
    len = msg.indexOf(" ");
  }

  // get command name
  const commandName = msg.substr(0, len).toLowerCase().trim();

  const regex = / +/;

  let args = msg
    .substr(len + 1)
    .trim()
    .split(regex);

  // no args, set args variable to empty array
  if (len === msg.length) {
    args = [];
  }

  // retrieve matching command
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  // no matching command exists
  if (!command) {
    return;
  }

  // prevent sending commands outside of a server
  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply("Cannot execute that command outside of a server!");
  }

  if (command.permissions) {
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      return message.reply(
        "You do not have permissions to execute this command!"
      );
    }
  }

  // args are required but not provided
  if (command.args && !args.length) {
    let reply = "Arguments are required!";
    if (command.usage) {
      reply += `\nThe proper usage would be: \`${sPrefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }

  // execute the command
  try {
    command.execute(message, args, (error, response) => {
      if (error) {
        return message.reply(error);
      }
      return message.channel.send(response);
    });
  } catch (error) {
    console.error(error);
    message.reply("There was an error trying to execute that command");
  }
};

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

// remove user subscriptions from all voice channels in server
const removeUser = async (server, user) => {
  let serverData;
  try {
    serverData = await Server.findOne({ serverID: server.id });
  } catch (e) {
    console.error(e);
  }
  if (!serverData) {
    return console.log("Cannot find server for removed user!");
  }
  // serverData.voiceChannels.forEach(async (channel) => {
  //   const index = channel.subs.indexOf(user.id);
  //   channel.subs.splice(index, 1);
  //   await channel.save();
  // });

  const userData = await User.findOne({
    userID: user.id,
    server: serverData._id,
  });
  if (!userData) {
    return console.log("Cannot find user data!");
  }

  await VC.updateMany(
    { owner: userData.server },
    { $pull: { subs: userData._id } }
  );

  await User.deleteOne({ userID: user.id });
  const index = serverData.users.indexOf(userData._id);
  serverData.users.splice(index, 1);
  await serverData.save();
};

const addUser = async (guild, user) => {
  const server = await Server.findOne({ serverID: guild.id });
  if (!server) {
    return console.log("Could not find server to add user!");
  }
  console.log(user);
  addNewUser(user, server);
};

module.exports = {
  updateDatabase,
  handleCommand,
  pingUsers,
  saveServerToDb,
  deleteServerFromDb,
  addNewChannel,
  findAndDeleteChannel,
  removeUser,
  addUser,
};
