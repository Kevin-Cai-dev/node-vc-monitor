const Server = require("../../models/server");

module.exports = {
  name: "prefix",
  description: "change the prefix used for commands",
  args: true,
  usage: "<prefix>",
  guildOnly: true,
  async execute(message, args, callback) {
    // find matching server data + prefix
    const guild = message.guild;

    let server;
    try {
      server = await Server.findOne({ serverID: guild.id });
    } catch (e) {
      console.error(e);
    }
    const prefix = server.prefix;

    // regex pattern to test for special characters
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    if (!server) {
      return callback("Error loading server data!");
    }
    if (args[0].length > 2) {
      return callback("New prefix is too long!");
    }

    // test args to see if they can be used as a new prefix
    for (let i = 0; i < args[0].length; i++) {
      if (!format.test(args[0].charAt(i))) {
        return callback("Invalid prefix!");
      }
    }
    // update prefix
    const response = `Prefix successfully changed from \`${prefix}\` to \`${args[0]}\`.`;
    server.prefix = args[0];
    await server.save();
    callback(undefined, response);
  },
};
