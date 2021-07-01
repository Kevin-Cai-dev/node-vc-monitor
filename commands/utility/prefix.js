const fs = require('fs')

module.exports = {
    name: 'prefix',
    description: 'change the prefix used for commands',
    args: true,
    usage: '<prefix>',
    guildOnly: true,
    execute(message, args, callback) {
        const buffer = fs.readFileSync('data/database.json')
        const data = JSON.parse(buffer)
        const guild = message.guild
        const server = data.find((server) => server.serverID === guild.id)
        const prefix = server.prefix
        const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/
        if (!server) {
            return callback('Error loading server data!')
        }
        if (args[0].length > 2) {
            return callback('New prefix is too long!')
        }
        for (let i = 0; i < args[0].length; i++) {
            if (!format.test(args[0].charAt(i))) {
                return callback('Invalid prefix!')
            }
        }
        const response = `Prefix successfully changed from \`${prefix}\` to \`${args[0]}\`.`
        server.prefix = args[0]
        callback(undefined, response, data)
    }
}