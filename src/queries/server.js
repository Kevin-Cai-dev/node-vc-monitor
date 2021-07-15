const Server = require('../models/server')

const serverAdd = async (serverID) => {
    const newServer = new Server({ serverID })
    await newServer.save()
}

const serverRemove = async (serverID) => {
    await Server.findOneAndDelete({ serverID })
}

const serverGet = async (serverID) => {
    return Server.findOne({ serverID })
}

module.exports = {
    serverAdd,
    serverRemove,
    serverGet
}