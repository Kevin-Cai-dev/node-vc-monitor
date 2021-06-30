const fs = require('fs')
require('dotenv').config()
const discord = require('discord.js')
const { create } = require('domain')

const client = new discord.Client()
const prefix = process.env.PREFIX;

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

const createData = (serverID, data) => {
    const guild = client.guilds.cache.get(serverID)
    const obj = createServer(serverID)
    const vc = guild.channels.cache.array().filter((voice) => voice.type === 'voice')
    vc.forEach((channel) => obj.vc.push(createVC(channel.id)))
    data.push(obj)
}

const updateDatabase = () => {
    const guilds = client.guilds.cache.array().map(server => server.id)
    // removing servers which the bot is not present in
    let newData = data.filter((server) => guilds.includes(server.serverID))
    // adding servers which the bot has not registered
    for (let i = 0; i < guilds.length; i++) {
        const guildID = guilds[i]
        const found = newData.some((server) => server.serverID === guildID)
        if (!found) {
            createData(guildID, newData)
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
    const guild = newState.guild
    const guildID = newState.guild.id
    const oldChannel = oldState.channel
    const newChannel = newState.channel
    const member = newState.member

    // a new user has joined an empty voice channel
    if (!oldChannel && newChannel) {
        const channelID = newChannel.id
        // console.log(member)
        // console.log(`${member.displayName} joined ${newChannel.name}!`)
        const numUsers = newChannel.members.array().length
        if (numUsers === 1) {
            const server = data.find((element) => element.serverID === guildID)
            const subscriptions = server.vc.find((channel) => channel.vcID === channelID)
            // console.log(subscriptions)
            subscriptions.subscribed.forEach((user) => {
                if (member.id != user) {
                    const receiver = guild.members.cache.get(user)
                    member.send(`${receiver}, ${member.displayName} joined the voice channel ${newChannel.displayName} in server \'${guild.name}\'!`)                        
                }
            })
        }
    }
})

// event handler for server joining
client.on('guildCreate', (guild) => {
    createData(guild.id, data)
    console.log(data)
    const newBotData = JSON.stringify(data)
    fs.writeFileSync('data/database.json', newBotData)
})

//event handler for server leaving
client.on('guildDelete', (guild) => {
    const guildID = guild.id
    const newData = data.filter((obj) => obj.serverID !== guildID)
    data = newData
    const newBotData = JSON.stringify(data)
    fs.writeFileSync('data/database.json', newBotData)
})

client.login(process.env.TOKEN)