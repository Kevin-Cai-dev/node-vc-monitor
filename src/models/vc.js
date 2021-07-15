const mongoose = require('mongoose')

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

vcSchema.pre('deleteMany', async function(next) {
    // delete vc id from all users using updateMany
    next()
})

vcSchema.pre('deleteOne', async function(next) {
    // similar to deleteMany, just with one channel
    next()
})

const VC = mongoose.model('VC', vcSchema)

module.exports = VC