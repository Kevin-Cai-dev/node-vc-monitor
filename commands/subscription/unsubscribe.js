const fs = require('fs')
const { argv } = require('process')

module.exports = {
    name: 'unsubscribe',
    description: 'command to unsubscribe from one or more voice channels',
    args: true,
    usage: '<voiceChannels | all>',
    guildOnly: true,
    execute(message, args) {
        // load in stored data
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        // find matching server in data
        const server = newData.find((element) => element.serverID === guild.id)
        // extract all voice channel in server
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        let flag = true

        // 'all' arg specified, unsub to all voice channels in the server
        if (args[0] === 'all' && args.length === 1) {
            server.vc.forEach((channel) => {
                const index = channel.subscribed.indexOf(member.id)
                channel.subscribed.splice(index, 1)
            })
        } 
        // attempt to unsubscribe from all specified channel names
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
                // removing member from subscription list
                const index = found.subscribed.indexOf(member.id)
                found.subscribed.splice(index, 1)
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