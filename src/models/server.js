const mongoose = require('mongoose')
const VC = require('./vc')

const serverSchema = new mongoose.Schema({
    serverID: {
        type: String,
        required: true
    }
})

serverSchema.virtual('tasks', {
    ref: 'VC',
    localField: '_id',
    foreignField: 'owner'
})

serverSchema.pre('remove', async function(next) {
    await VC.deleteMany({ owner: this._id })
    next()
})

const Server = mongoose.model('Server', serverSchema)

module.exports = Server