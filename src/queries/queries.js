const Server = require('../models/server')
const VC = require('../models/vc')

const addChannelToDb = (vcID, server, guildId) => {
    const newVC = VC({ vcID, owner: server})
    newVC.save(async () => {
        await Server.updateOne(
            { serverID: guildId},
            { $push: { voiceChannels: newVC } }
        )
    })
}

const saveServerToDb = (guild) => {
    // save the server
    const server = new Server({ serverID: guild.id })
    server.save()

    // loop through all voice channels, save them and add references
    const voicehannels = guild.channels.cache.array().filter(voice => voice.type === 'voice')
    voicehannels.forEach(channel => {
        addChannelToDb(channel.id, server, guild.id)
    })
}

// update database upon launching
const updateDatabase = async (client) => {
    const guilds = client.guilds.cache.array()
    const guildIds = guilds.map(server => server.id)

    // delete guilds which the bot is no longer part of
    await Server.deleteMany({ serverID: { $nin: guildIds } })


    // get all saved servers in database
    const saved = await Server.find({ serverID: { $in: guildIds } })
    // extract all ids of saved servers
    const savedServerIds = saved.map(server => server.serverID)
    // get all server objects from Discord API matching database entries
    const currentServers = guilds.filter(server => savedServerIds.includes(server.id))
    
    // loop over all current servers that are stored in database
    currentServers.forEach(async (guild) => {

        const server = await Server.findOne({ serverID: guild.id })

        // get ids for all voice channels in server
        const voiceChannelIds = guild.channels.cache.array().filter(voice => voice.type === 'voice').map(vc => vc.id)

        // get currently stored voice channels for matching server
        const currentVC = await Server.findOne({ serverID: guild.id }).populate('voiceChannels')

        const currentVCIds = currentVC.voiceChannels.map(vc => vc.vcID)

        const toDelete = currentVCIds.filter(id => !voiceChannelIds.includes(id))
        const toAdd = voiceChannelIds.filter(id => !currentVCIds.includes(id))
        // delete voice channels that do not exist

        toDelete.forEach(async del => {
            const dbID = await VC.findOne({ vcID: del }, '_id')
            await Server.findOneAndUpdate({ serverID: guild.id }, {$pull: { voiceChannels: dbID._id} })
        })
        await VC.deleteMany({ vcID: { $in: toDelete } })
        

        toAdd.forEach(async add => {
            addChannelToDb(add, server, guild.id)
        })
    })

    // add guilds which the bot is part of, but is not in the database
    const newServers = guilds.filter(server => !savedServerIds.includes(server.id))
    newServers.forEach(guild => {
        saveServerToDb(guild)
    })
}



const handleCommand = async (client, message) => {
    let sPrefix = undefined
    let server = undefined
    const guild = message.guild

    // message was from dm, use default prefix
    if (!guild) {
        sPrefix = process.env.PREFIX
    } else {
        server = await Server.findOne({ serverID: guild.id })

        if (!server) {
            return
        }
        sPrefix = server.prefix
    }

    // message does not start with prefix
    if (!message.content.startsWith(sPrefix)) {
        return
    }
    
    // split up command args on whitespaces
    const msg = message.content.slice(sPrefix.length)
    let len = msg.length
    if (msg.indexOf(' ') !== -1) {
        len = msg.indexOf(' ')
    }

    // get command name
    const commandName = msg.substr(0, len).toLowerCase().trim()

    let regex = / +/

    // change regex split pattern for subscription commands, split on commas
    if (commandName === 'subscribe' || commandName === 'unsubscribe') {
        regex = /\s*,\s*(?![^(]*\))/
    }
    
    let args = msg.substr(len + 1).trim().split(regex)

    // no args, set args variable to empty array
    if (len === msg.length) {
        args = []
    }

    // retrieve matching command
    const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
    
    // no matching command exists
    if (!command) {
        return
    }

    // prevent sending commands outside of a server
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('Cannot execute that command outside of a server!')
    }

    // args are required but not provided
    if (command.args && !args.length) {
        let reply = 'Arguments are required!'
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${sPrefix}${command.name} ${command.usage}\``
        }
        return message.channel.send(reply)
    }

    // execute the command
    try {
        command.execute(message, args, (error, response, rData) => {
            if (error) {
                return message.reply(error)
            }
            if (rData) {
                const newBotData = JSON.stringify(rData)
                fs.writeFileSync('./src/data/database.json', newBotData)
                data = rData
            }
            return message.channel.send(response)
        })
    } catch (error) {
        console.error(error)
        message.reply('There was an error trying to execute that command')
    }
}

const pingUsers = async (guild, newChannel, member, recentDM) => {

    const voiceChannel = await VC.findOne({ vcID: newChannel.id })

    if (!voiceChannel) {
        return console.error('Could not read voice channel data!')
    }

    let allMembers = undefined
    try {
        allMembers = await guild.members.fetch()
    } catch (e) {
        return console.error(e)
    }

    if (!allMembers) {
        return console.log('allMembers is undefined!')
    }

    voiceChannel.subs.forEach((user) => {
        if (member.id !== user) {
            const receiver = allMembers.get(user)
            if (!receiver) {
                return console.log('no receiver found!')
            }
            if (recentDM.has(receiver.id)) {
                return
            }

            try {
                receiver.send(`${receiver}, ${member.displayName} joined the voice channel ${newChannel.name} in server \'${guild.name}\'!`)
                recentDM.add(receiver.id)
                setTimeout(() => {
                    recentDM.delete(receiver.id)
                }, 20000)
            } catch (error) {
                console.error(error)
            } 
        }
    })
}

module.exports = {
    updateDatabase,
    handleCommand,
    pingUsers
}