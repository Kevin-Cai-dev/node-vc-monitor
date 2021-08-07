const fs = require("fs");
const Server = require("../../models/server");

module.exports = {
  name: "help",
  description: "List all of my commands or info about a specific command",
  uasge: "[command name]",
  guildOnly: true,
  async execute(message, args) {
    const data = [];
    const { commands } = message.client;
    const guild = message.guild;

    let server;
    try {
      server = await Server.findOne({ serverID: guild.id });
    } catch (e) {
      console.error(e);
    }
    const prefix = server.prefix;

    // no args provided
    if (!args.length) {
      const tick = "```";
      data.push("Here is a list of all available commands:");
      data.push(tick);
      data.push(commands.map((command) => `${command.name}`).join(", "));
      data.push(tick);
      data.push(
        `You can send \`${prefix}help [command name]\` to get info on a specific command`
      );
      return message.channel.send(data, { split: true });
    }

    // too many args provided
    if (args.length !== 1) {
      return message.reply("Too many commands specified!");
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name);
    // cannot find command specified
    if (!command) {
      return message.reply("That's not a valid command!");
    }
    data.push(`**Name:** ${command.name}`);
    if (command.aliases) {
      data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    }
    if (command.description) {
      data.push(`**Description:** ${command.description}`);
    }
    if (command.usage) {
      data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
    }

    message.channel.send(data, { split: true });
  },
};
