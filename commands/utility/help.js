require('dotenv').config()
const fs = require('fs')

module.exports = {
    name: 'help',
    description: 'List all of my commands or info about a specific command',
    uasge: '[command name]',
    execute(message, args, callback) {
        const data = []
        const { commands } = message.client
        const guild = message.guild

        const storedData = fs.readFileSync('data/database.json')
        const serverData = JSON.parse(storedData)
        const server = serverData.find((server) => server.serverID === guild.id)
        const prefix = server.prefix

        if (!args.length) {
            data.push('Here is a list of all available commands:')
            data.push(commands.map((command) => command.name).join('\n'))
            data.push(`You can send \`${prefix}help [command name]\` to get info on a specific command`)
            return message.channel.send(data, { split: true })
        }

        if (args.length !== 1) {
            return message.reply('Too many commands specified!')
        }

        const name = args[0].toLowerCase()
        const command = commands.get(name)
        if (!command) {
            return message.reply('That\'s not a valid command!')
        }
        data.push(`**Name:** ${command.name}`)
        if (command.description) {
            data.push(`**Description:** ${command.description}`)
        }
        if (command.usage) {
            data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`)
        }

        message.channel.send(data, { split: true })
    }
}