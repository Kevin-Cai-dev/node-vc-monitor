const Server = require("../models/server");

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

module.exports = handleCommand;
