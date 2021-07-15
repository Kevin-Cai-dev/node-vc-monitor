const mongoose = require('mongoose')
const Server = require('../models/server')

const vcSchema = new mongoose.Schema({
    vcID: {
        type: String,
        required: true
    },
    subs: [{ type: String }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server'
    }
})

// vcSchema.pre('deleteMany', async function(next) {
//     // delete vc id from parent server voiceChannel array
//     const deletedData = await VC.find(this._conditions)
//     if (deletedData.length !== 0) {
//         const deletedID = deletedData.map(data => data.vcID)
//         const owner = deletedData[0].owner
//         await Server.update(
//             { _id: owner },
//             {$pull: {voiceChannels: { $in: deletedID } } }
//         )
//     }
//     next()
// })

// vcSchema.pre('deleteOne', async function(next) {
//     // similar to deleteMany, just with one channel
//     next()
// })

const VC = mongoose.model('VC', vcSchema)

module.exports = VC