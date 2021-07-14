const mongoose = require('mongoose')

const vcSchema = new mongoose.Schema({
    vcID: {
        type: String,
        required: true
    },
    users: [{type: String}],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server'
    }
})

const VC = mongoose.model('VC', vcSchema)

module.exports = VC