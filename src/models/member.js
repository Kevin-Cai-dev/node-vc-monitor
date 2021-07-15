const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema( {
    memberID: {
        type: String,
        required: true
    },
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VC' }]
})

memberSchema.pre('deleteOne', async function(next) {
    // remove member id from all voice channel references using updateMany to
    // single out channels
    next()
})

const Member = mongoose.model('Member', memberSchema)

module.exports = Member