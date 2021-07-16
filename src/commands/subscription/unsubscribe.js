const fs = require('fs')
const stringSimilarity = require('string-similarity')
const Server = require('../../models/server')
const VC = require('../../models/vc')

module.exports = {
    name: 'unsubscribe',
    description: 'command to unsubscribe from one or more voice channels',
    args: true,
    usage: '<channelName1,channelName2 ... | all>',
    guildOnly: true,
    aliases: ['unsub', 'us'],
    async execute(message, args, callback) {
        const guild = message.guild
        const member = message.member
        const server = await Server.findOne({ serverID: guild.id }).populate('voiceChannels')
        // extract all voice channel in server
        const vcAll = guild.channels.cache.filter((channel) => channel.type === 'voice')
        const vcNames = vcAll.map((vc) => vc.name.toLowerCase())

        let error = 'Could not unsubscribe from channels: '
        let response = 'Unsubscribed successfully!'

        // 'all' arg specified, unsub to all voice channels in the server
        if (args[0] === 'all' && args.length === 1) {
            const voiceChannels = server.voiceChannels
            voiceChannels.forEach(async (channel) => {
                await VC.updateOne(
                    { vcID: channel.vcID },
                    { $pull: { subs: member.id } }
                )
            })
        } 
        // attempt to unsubscribe from all specified channel names
        else {
            for (let i = 0; i < args.length; i++) {
                args[i] = args[i].trim()

                // finding the best matching voice channel name based on args
                const { bestMatch } = stringSimilarity.findBestMatch(args[i], vcNames)
                
                if (bestMatch.rating < 0.1) {
                    error += `${args[i]},`
                    continue
                }

                // finding voice channel matching given name
                const vc = vcAll.find((channel) => channel.name.toLowerCase() === bestMatch.target)
                
                if (!vc) {
                    error += `${args[i]},`
                    continue
                }

                const voiceChannelData = await VC.findOne({ vcID: vc.id })
                // finding matching voice channel data entry
                if (!voiceChannelData) {
                    error += `${args[i]},`
                    continue
                }

                const index = voiceChannelData.subs.indexOf(member.id)
                voiceChannelData.subs.splice(index, 1)
                await voiceChannelData.save()
            }
        }

        const lastChar = error.charAt(error.length - 1)
        error = error.slice(0, -1)
        if (lastChar === ' ') {
            callback(undefined, response)
        } else {
            callback(error)
        }
    }
}