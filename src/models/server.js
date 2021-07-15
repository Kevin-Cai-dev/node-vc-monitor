const mongoose = require('mongoose')
const VC = require('./vc')

const serverSchema = new mongoose.Schema({
    serverID: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        required: true,
        maxLength: 20,
        default: process.env.PREFIX
    },
    voiceChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VC' }]
})

// serverSchema.virtual('tasks', {
//     ref: 'VC',
//     localField: '_id',
//     foreignField: 'owner'
// })

serverSchema.pre('deleteOne', async function(next) {
    await VC.deleteMany({ owner: this._id })
    next()
})

serverSchema.pre('deleteMany', async function(next) {
    // for each server, call VC.deleteMany
    const deletedData = await Server.find(this._conditions)
    if (deletedData.length !== 0) {
        deletedData.forEach(async del => {
            await VC.deleteMany({ owner: del._id })
        })
    }
    next()
})

const Server = mongoose.model('Server', serverSchema)

module.exports = Server