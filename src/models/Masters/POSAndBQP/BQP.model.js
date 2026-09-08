const mongoose = require('mongoose');

const bqpSchema = new mongoose.Schema({
    bqpName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
    emailId: {
        type: String,
    },
    codeNumber: {
        type: String,
    },
    aadharNumber: {
        type: String,
    },
    panNumber: {
        type: String,
    },
    lastTrainingAttended: {
        type: Date,
    },
    nextTrainingDueDate: {
        type: Date,
    },
    reminderAlerts: {
        type: Boolean,
        default: false,
    },
    delete: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
}, {
    versionKey: false,
    timestamps: true,
});

const BQPModel = mongoose.model('BQP_Master', bqpSchema);
module.exports = BQPModel;
