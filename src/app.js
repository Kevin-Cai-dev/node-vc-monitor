require('dotenv').config()
const discord = require('discord.js')

const client = new discord.Client()

// start up discord bot
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('message', (message) => {
    console.log(message)
})

client.on('voiceStateUpdate', (oldState, newState) => {
    const oldChannel = oldState.channel
    const newChannel = newState.channel
    if (!oldChannel && newChannel) {
        console.log('New user!')
    }
})

client.login(process.env.TOKEN)