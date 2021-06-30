const fs = require('fs')

module.exports = {
    name: 'subscribe',
    description: 'Command to subscribe to one or more voice channels',
    args: true,
    usage: '<channelNames | all>',
    guildOnly: true,
    execute(message, args) {
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        const server = newData.find((element) => element.serverID === guild.id)
        const vcAll = message.guild.channels.cache.filter((channel) => channel.type === 'voice')
        console.log(vcAll)
        let flag = true

        // attempt to add to all voice channels
        if (args[0] === 'all' && args.length === 1) {
            server.vc.forEach((channel) => {
                const exists = channel.subscribed.some((uid) => uid === member.id)
                if (!exists) {
                    channel.subscribed.push(member.id)
                }
            })
        } else {
            // only add to specified channels in args
            for (let i = 0; i < args.length; i++) {
                const vc = vcAll.find((channel) => channel.name.toLowerCase() === args[i])
                if (!vc) {
                    flag = false
                    break
                }
                const found = server.vc.find((channel) => channel.vcID === vc.id)
                if (!found) {
                    flag = false
                    break
                }
                const exists = found.subscribed.some((uid) => uid === member.id)
                if (exists) {
                    continue
                }
                found.subscribed.push(member.id)
            }
        }

        if (flag) {
            // commit changes here
            const newBotData = JSON.stringify(newData)
            fs.writeFileSync('data/database.json', newBotData)
            data = newData
        } else {
            message.channel.send('Could not find channel(s) OR already subscribed to all specified channels.')
        }
    }
}