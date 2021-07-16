const fs = require('fs')
require('dotenv').config({ path: './src/config/dev.env' })
require('./data/mongoose')
const Discord = require('discord.js')
const { updateDatabase, handleCommand, pingUsers } = require('./queries/queries')

const intents = new Discord.Intents([
    Discord.Intents.NON_PRIVILEGED,
    'GUILD_MEMBERS'
])

const client = new Discord.Client({ ws: { intents } })
client.commands = new Discord.Collection()

const recentDM = new Set()

// Adding commands to client
const commandFolders = fs.readdirSync('./src/commands')

// load commands into client
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter((file) => file.endsWith('.js'))
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`)
        client.commands.set(command.name, command)
    }
}
// retrieve default prefix
const prefix = process.env.PREFIX;




// start up Discord bot
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
    updateDatabase(client)
})

// event handler to respond to messages/commands
client.on('message', (message) => {
    // message is from a bot
    if (message.author.bot) {
        return
    }
    
    handleCommand(client, message)
})

// event handler to monitor users joining voice channels
client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = newState.guild
    const oldChannel = oldState.channel
    const newChannel = newState.channel
    const member = newState.member

    // a new user has joined an empty voice channel
    if (!oldChannel && newChannel) {
        const numUsers = newChannel.members.array().length
        // no activity previously in the voice channel
        if (numUsers === 1) {
            pingUsers(guild, newChannel, member, recentDM)
        }
    }
})

// // event handler for server joining
// client.on('guildCreate', (guild) => {
//     createData(guild.id, data)
//     console.log(data)
//     const newBotData = JSON.stringify(data)
//     fs.writeFileSync('./data/database.json', newBotData)

//     let channelID = undefined
//     const channels = guild.channels.cache.array()

//     // find the first text channel in the server
//     for (const key in channels) {
//         const c = channels[key]
//         if (c.type === 'text') {
//             channelID = c.id;
//             break
//         }
//     }

//     if (channelID) {
//         // locate either the systemChannel or the first text channel
//         const id = guild.systemChannelID || channelID
//         const channel = channels.find((c) => c.id === id)
//         // send an introduction message to the server
//         channel.send(`Hi, I\'m a bot designed to monitor voice channels. Type \`${prefix}help\` to get started!`)
//     }

// })

// //event handler for server leaving, removes server from database
// client.on('guildDelete', (guild) => {
//     const guildID = guild.id
//     const newData = data.filter((obj) => obj.serverID !== guildID)
//     data = newData
//     const newBotData = JSON.stringify(data)
//     fs.writeFileSync('./data/database.json', newBotData)
// })

// TODO:
// channel add, channel delete, user leave

client.login(process.env.TOKEN)