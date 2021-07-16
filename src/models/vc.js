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

vcSchema.post('findOne', function(error, doc, next) {
    if (error) {
        next(error)
    } else {
        next()
    }
})

vcSchema.post('deleteMany', function(error, doc, next) {
    if (error) {
        next(error)
    } else {
        next()
    }
})

const VC = mongoose.model('VC', vcSchema)

module.exports = VC