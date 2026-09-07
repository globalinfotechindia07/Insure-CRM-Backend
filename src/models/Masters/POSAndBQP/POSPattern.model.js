const mongoose = require('mongoose');

const posPatternSchema = new mongoose.Schema({
    prefix: {
        type: String,
        required: true,
        default: 'POS-',
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

const POSPatternModel = mongoose.model('POS_Pattern', posPatternSchema);
module.exports = POSPatternModel;
