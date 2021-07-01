const fs = require('fs')
const stringSimilarity = require('string-similarity')

module.exports = {
    name: 'unsubscribe',
    description: 'command to unsubscribe from one or more voice channels',
    args: true,
    usage: '<channelName1,channelName2 ... | all>',
    guildOnly: true,
    aliases: ['unsub', 'us'],
    execute(message, args, callback) {
        // load in stored data
        const JSONData = fs.readFileSync('data/database.json')
        const newData = JSON.parse(JSONData)
        const guild = message.guild
        const member = message.member
        // find matching server in data
        const server = newData.find((element) => element.serverID === guild.id)
        // extract all voice channel in server
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        const vcNames = vcAll.map((vc) => vc.name.toLowerCase())
        let error = undefined
        let response = 'Unsubscribed successfully!'

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
                args[i] = args[i].trim()

                // finding the best matching voice channel name based on args
                const { bestMatch } = stringSimilarity.findBestMatch(args[i], vcNames)

                // finding voice channel matching given name
                const vc = vcAll.find((channel) => channel.name.toLowerCase() === bestMatch.target)
                
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
                const vcChannel = guild.channels.cache.get(found.vcID)
                if (vcChannel.permissionsFor(member).has('VIEW_CHANNEL')) {
                    // removing member from subscription list
                    const index = found.subscribed.indexOf(member.id)
                    found.subscribed.splice(index, 1)
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