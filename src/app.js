const fs = require('fs')
require('dotenv').config()
const discord = require('discord.js')

const client = new discord.Client()

const JSONData = fs.readFileSync('data/database.json')
let data = JSON.parse(JSONData)

const createVC = (vcID) => {
    return {
        vcID,
        subscribed: []
    }
}

const createServer = (serverID) => {
    return {
        serverID,
        vc: []
    }
}

const updateDatabase = () => {
    const guilds = client.guilds.cache.array().map(server => server.id)
    // removing servers which the bot is not present in
    let newData = data.filter((server) => guilds.includes(server.serverID))
    // adding servers which the bot has not registered
    for (let i = 0; i < guilds.length; i++) {
        const guildID = guilds[i]
        const found = newData.some(server => server.serverID === guildID)
        if (!found) {
            const newServer = createServer(guildID)
            const guild = client.guilds.cache.get(guildID)
            const vc = guild.channels.cache.array().filter(voice => voice.type === 'voice')
            vc.forEach(channel => newServer.vc.push(createVC(channel.id)))
            newData.push(newServer)
        }
    }
    data = newData
    const newBotData = JSON.stringify(newData)
    fs.writeFileSync('data/database.json', newBotData)
}

// start up discord bot
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
    updateDatabase()
})

// event handler to respond to messages/commands
client.on('message', (message) => {
    console.log(message)
})

// event handler to monitor users joining voice channels
client.on('voiceStateUpdate', (oldState, newState) => {
    const guildID = oldState.guild.id
    const oldChannel = oldState.channel
    const newChannel = newState.channel
    const member = newState.member

    // a new user has joined an empty voice channel
    if (!oldChannel && newChannel) {
        console.log(`${member.displayName} joined ${newChannel.name}!`)
        const numUsers = newChannel.members.array().length
        if (numUsers === 1) {
            const server = data.find((element) => {
                element.s_id === guildID
            })
            console.log(server.displayName)
        }
    }
})

// event handler for server joining

//event handler for server leaving

client.login(process.env.TOKEN)