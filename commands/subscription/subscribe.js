const fs = require('fs')

module.exports = {
    name: 'subscribe',
    description: 'Command to subscribe to one or more voice channels',
    args: true,
    usage: '<channelNames | all>',
    guildOnly: true,
    execute(message, args) {
        // load in stored data
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        // find matching server in data
        const server = newData.find((element) => element.serverID === guild.id)
        // extract all voice channels in server
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        let flag = true

        // 'all' arg specified, attempting to subscribe to all voice channels
        if (args[0] === 'all' && args.length === 1) {
            server.vc.forEach((channel) => {
                const exists = channel.subscribed.some((uid) => uid === member.id)
                if (!exists) {
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
                    flag = false
                    break
                }
                // finding matching voice channel data entry
                const found = server.vc.find((channel) => channel.vcID === vc.id)
                if (!found) {
                    flag = false
                    break
                }
                // member already exists, ignore
                const exists = found.subscribed.some((uid) => uid === member.id)
                if (exists) {
                    continue
                }
                // add member to subscription list
                found.subscribed.push(member.id)
            }
        }

        if (flag) {
            // commit changes
            const newBotData = JSON.stringify(newData)
            fs.writeFileSync('data/database.json', newBotData)
            data = newData
        } else {
            message.channel.send('Could not find channel(s).')
        }
    }
}