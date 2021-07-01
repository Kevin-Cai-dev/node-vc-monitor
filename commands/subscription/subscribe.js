const fs = require('fs')

module.exports = {
    name: 'subscribe',
    description: 'Command to subscribe to one or more voice channels',
    args: true,
    usage: '<channelNames | all>',
    guildOnly: true,
    execute(message, args, callback) {
        // load in stored data
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        // find matching server in data
        const server = newData.find((element) => element.serverID === guild.id)
        // extract all voice channels in server
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        let error = undefined
        let response = 'Successfully subscribed!'

        // 'all' arg specified, attempting to subscribe to all voice channels
        if (args[0] === 'all' && args.length === 1) {
            server.vc.forEach((channel) => {
                const exists = channel.subscribed.some((uid) => uid === member.id)
                const vcChannel = guild.channels.cache.get(channel.vcID)

                if (!exists && vcChannel.permissionsFor(member).has('VIEW_CHANNEL')) {
                    channel.subscribed.push(member.id)
                }
            })
        } 
        // attempt to subscribe to all specified channel names
        else {
            for (let i = 0; i < args.length; i++) {
                // finding voice channel matching given name
                const vc = vcAll.find((channel) => channel.name.toLowerCase() === args[i])
                if (!vc) {
                    error = 'Could not find channel(s)'
                    break
                }
                // finding matching voice channel data entry
                const found = server.vc.find((channel) => channel.vcID === vc.id)
                if (!found) {
                    error = 'Could not find channel(s)'
                    break
                }

                const exists = found.subscribed.some((uid) => uid === member.id)
                const vcChannel = guild.channels.cache.get(found.vcID)

                if (exists) {
                    continue
                }

                if (vcChannel.permissionsFor(member).has('VIEW_CHANNEL')) {
                    // add member to subscription list
                    found.subscribed.push(member.id)
                } else {
                    error = 'Could not find channel(s)'
                }

            }
        }

        if (error) {
            callback(error)
        } else {
            callback(undefined, response, newData)
        }
    }
}