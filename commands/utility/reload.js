/* Reload command structure and code obtained from Discord.js Guide on 1/6/2021
at https://discordjs.guide/command-handling/adding-features.html#reloading-commands
*/

const fs = require('fs')

module.exports = {
    name: 'reload',
    description: 'reloads a command',
    args: true,
    execute(message, args, callback) {
        if (!args.length) {
            callback('No arguments provided!')
        }
        const commandName = args[0].toLowerCase()
        const command = message.client.commands.get(commandName) || message.client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
        
        if (!command) {
            callback(`There is no command with name or alias \`${commandName}\`.`)
        }

        const commandFolders = fs.readdirSync('./commands')
        const folderName = commandFolders.find((folder) => fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`))
        
        delete require.cache[require.resolve(`../${folderName}/${command.name}.js`)]
        
        try {
            const newCommand = require(`../${folderName}/${command.name}.js`)
            message.client.commands.set(newCommand.name, newCommand)
            callback(undefined, `Command \`${newCommand.name}\` was reloaded!`)
        } catch (error) {
            console.error(error)
            callback(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``)
        }
    }
}