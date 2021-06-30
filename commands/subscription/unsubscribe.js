const fs = require('fs')
const { argv } = require('process')

module.exports = {
    name: 'unsubscribe',
    description: 'command to unsubscribe from one or more voice channels',
    args: true,
    usage: '<voiceChannels | all>',
    guildOnly: true,
    execute(message, args) {
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        const server = newData.find((element) => element.serverID === guild.id)
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        let flag = true

        if (args[0] === 'all' && args.length === 1) {
            console.log('wow!')
            server.vc.forEach((channel) => {
                const index = channel.subscribed.indexOf(member.id)
                channel.subscribed.splice(index, 1)
            })
        } else {
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
                const index = found.subscribed.indexOf(member.id)
                found.subscribed.splice(index, 1)
            }
        }

        if (flag) {
            const newBotData = JSON.stringify(newData)
            fs.writeFileSync('data/database.json', newBotData)
            data = newData
        } else {
            message.channel.send('Could not find channel(s).')
        }
    }
}