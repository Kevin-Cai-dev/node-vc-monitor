const Server = require("../models/server");
const VC = require("../models/vc");
const User = require("../models/user");
const { addNewUser } = require("./helper");

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

  await userData.remove();
  const index = serverData.users.indexOf(userData._id);
  serverData.users.splice(index, 1);
  await serverData.save();
};

const addUser = async (guild, user) => {
  const server = await Server.findOne({ serverID: guild.id });
  if (!server) {
    return console.log("Could not find server to add user!");
  }
  addNewUser(user, server);
};

module.exports = {
  removeUser,
  addUser,
};
