const fs = require('fs')
require('dotenv').config({ path: './src/config/dev.env' })
require('./data/mongoose')
const Discord = require('discord.js')


















// const intents = new Discord.Intents([
//     Discord.Intents.NON_PRIVILEGED,
//     'GUILD_MEMBERS'
// ])

// const client = new Discord.Client({ ws: { intents } })
// client.commands = new Discord.Collection()

// const recentDM = new Set()

// // Adding commands to client
// const commandFolders = fs.readdirSync('./src/commands')

// // load commands into client
// for (const folder of commandFolders) {
//     const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter((file) => file.endsWith('.js'))
//     for (const file of commandFiles) {
//         const command = require(`./commands/${folder}/${file}`)
//         client.commands.set(command.name, command)
//     }
// }
// // retrieve default prefix
// const prefix = process.env.PREFIX;

// // load JSON data
// const JSONData = fs.readFileSync('./src/data/database.json')
// let data = JSON.parse(JSONData)

// // helper function to create voice channel object for JSON data
// const createVC = (vcID) => {
//     return {
//         vcID,
//         subscribed: []
//     }
// }

// // helper function to create server object for JSON data
// const createServer = (serverID) => {
//     return {
//         serverID,
//         prefix,
//         vc: []
//     }
// }

// // Create a new entry for the JSON database for a new server
// const createData = (serverID, data) => {
//     const guild = client.guilds.cache.get(serverID)
//     const obj = createServer(serverID)
//     const vc = guild.channels.cache.array().filter((voice) => voice.type === 'voice')
//     vc.forEach((channel) => obj.vc.push(createVC(channel.id)))
//     data.push(obj)
// }

// // Updating database to remove old servers + add new servers
// const updateDatabase = () => {
//     const guilds = client.guilds.cache.array().map(server => server.id)
//     // removing servers which the bot is not present in
//     let newData = data.filter((server) => guilds.includes(server.serverID))
//     // adding servers which the bot has not registered
//     for (let i = 0; i < guilds.length; i++) {
//         const guildID = guilds[i]
//         const found = newData.some((server) => server.serverID === guildID)
//         if (!found) {
//             createData(guildID, newData)
//         }
//     }
//     data = newData
//     const newBotData = JSON.stringify(newData)
//     fs.writeFileSync('./src/data/database.json', newBotData)
// }




// // start up Discord bot
// client.on('ready', () => {
//     console.log(`Logged in as ${client.user.tag}`)
//     updateDatabase()
// })

// // event handler to respond to messages/commands
// client.on('message', (message) => {
//     // message is from a bot
//     if (message.author.bot) {
//         return
//     }
//     let sPrefix = undefined
//     let server = undefined
//     const guild = message.guild

//     // message was from dm, use default prefix
//     if (!guild) {
//         sPrefix = process.env.PREFIX
//     } else {
//         server = data.find((server) => server.serverID === guild.id)
//         if (!server) {
//             return
//         }
//         sPrefix = server.prefix
//     }

//     // message does not start with prefix
//     if (!message.content.startsWith(sPrefix)) {
//         return
//     }
    
//     // split up command args on whitespaces
//     const msg = message.content.slice(sPrefix.length)
//     let len = msg.length
//     if (msg.indexOf(' ') !== -1) {
//         len = msg.indexOf(' ')
//     }

//     // get command name
//     const commandName = msg.substr(0, len).toLowerCase().trim()

//     let regex = / +/

//     // change regex split pattern for subscription commands, split on commas
//     if (commandName === 'subscribe' || commandName === 'unsubscribe') {
//         regex = /\s*,\s*(?![^(]*\))/
//     }
    
//     let args = msg.substr(len + 1).trim().split(regex)

//     // no args, set args variable to empty array
//     if (len === msg.length) {
//         args = []
//     }

//     // retrieve matching command
//     const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
    
//     // no matching command exists
//     if (!command) {
//         return
//     }

//     // prevent sending commands outside of a server
//     if (command.guildOnly && message.channel.type === 'dm') {
//         return message.reply('Cannot execute that command outside of a server!')
//     }

//     // args are required but not provided
//     if (command.args && !args.length) {
//         let reply = 'Arguments are required!'
//         if (command.usage) {
//             reply += `\nThe proper usage would be: \`${sPrefix}${command.name} ${command.usage}\``
//         }
//         return message.channel.send(reply)
//     }

//     // execute the command
//     try {
//         command.execute(message, args, (error, response, rData) => {
//             if (error) {
//                 return message.reply(error)
//             }
//             if (rData) {
//                 const newBotData = JSON.stringify(rData)
//                 fs.writeFileSync('./src/data/database.json', newBotData)
//                 data = rData
//             }
//             return message.channel.send(response)
//         })
//     } catch (error) {
//         console.error(error)
//         message.reply('There was an error trying to execute that command')
//     }
// })

// // event handler to monitor users joining voice channels
// client.on('voiceStateUpdate', async (oldState, newState) => {
//     const guild = newState.guild
//     const guildID = newState.guild.id
//     const oldChannel = oldState.channel
//     const newChannel = newState.channel
//     const member = newState.member

//     // a new user has joined an empty voice channel
//     if (!oldChannel && newChannel) {
//         const channelID = newChannel.id
//         const numUsers = newChannel.members.array().length
//         // no activity previously in the voice channel
//         if (numUsers === 1) {
//             // find matching server data
//             const server = data.find((element) => element.serverID === guildID)
//             // find matching voice channel data

//             let subscriptions
//             try {
//                 subscriptions = await server.vc.find((channel) => channel.vcID === channelID)
//             } catch (e) {
//                 return console.error(e)
//             }

//             // iterate through all subscribed users of the voice channel

//             let allMembers = undefined
//             try {
//                 allMembers = await guild.members.fetch()
//             } catch (e) {
//                 return console.error(e)
//             }

//             if (!allMembers) {
//                 return console.log('allMembers is undefined!')
//             }

//             if (!subscriptions) {
//                 return console.error('Cannot find voice channels!')
//             }
//             subscriptions.subscribed.forEach((user) => {
//                 // user is not the same as the user who joined
//                 if (member.id !== user) {
//                     const receiver = allMembers.get(user)
//                     if (!receiver) {
//                         return console.log('receiver is undefined')
//                     }
//                     if (recentDM.has(receiver.id)) {
//                         return
//                     }

//                     // send dm notification
//                     try {
//                         receiver.send(`${receiver}, ${member.displayName} joined the voice channel ${newChannel.name} in server \'${guild.name}\'!`)
//                         recentDM.add(receiver.id)
//                         setTimeout(() => {
//                             recentDM.delete(receiver.id)
//                         }, 20000)
//                     } catch (error) {
//                         console.error(error)
//                     }                    
//                 }
//             })
//         }
//     }
// })

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

// client.login(process.env.TOKEN)