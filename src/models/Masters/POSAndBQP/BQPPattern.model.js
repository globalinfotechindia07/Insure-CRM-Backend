const mongoose = require('mongoose');

const bqpPatternSchema = new mongoose.Schema({
    prefix: {
        type: String,
        required: true,
        default: 'BQP-',
    },
    nextSequence: {
        type: Number,
        required: true,
        default: 1,
    },
    paddingSize: {
        type: Number,
        required: true,
        default: 3,
    }
}, {
    versionKey: false,
    timestamps: true,
});

const BQPPatternModel = mongoose.model('BQP_Pattern', bqpPatternSchema);
module.exports = BQPPatternModel;
