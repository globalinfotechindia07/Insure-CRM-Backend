const BQPModel = require('../../../models/Masters/POSAndBQP/BQP.model');
const BQPPatternModel = require('../../../models/Masters/POSAndBQP/BQPPattern.model');

// Create a new BQP entry
exports.createBQP = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Auto-generate codeNumber
        const pattern = await BQPPatternModel.findOneAndUpdate(
            {},
            { $inc: { nextSequence: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        const padding = pattern.paddingSize || 3;
        const currentSeq = pattern.nextSequence - 1;
        const sequenceStr = currentSeq.toString().padStart(padding, '0');
        data.codeNumber = `${pattern.prefix || 'BQP-'}${sequenceStr}`;

        const newBQP = new BQPModel(data);
        const savedBQP = await newBQP.save();
        res.status(201).json({ success: true, message: "BQP created successfully", data: savedBQP });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating BQP", error: error.message });
    }
};

// Get all BQP entries
exports.getAllBQP = async (req, res) => {
    try {
        const bqpList = await BQPModel.find({ delete: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: "BQP fetched successfully", data: bqpList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching BQP", error: error.message });
    }
};

// Get BQP entry by ID
exports.getBQPById = async (req, res) => {
    try {
        const bqp = await BQPModel.findById(req.params.id);
        if (!bqp || bqp.delete) {
            return res.status(404).json({ success: false, message: "BQP not found" });
        }
        res.status(200).json({ success: true, message: "BQP fetched successfully", data: bqp });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching BQP", error: error.message });
    }
};

// Update a BQP entry
exports.updateBQP = async (req, res) => {
    try {
        const updatedBQP = await BQPModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedBQP) {
            return res.status(404).json({ success: false, message: "BQP not found" });
        }
        res.status(200).json({ success: true, message: "BQP updated successfully", data: updatedBQP });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating BQP", error: error.message });
    }
};

// Delete a BQP entry (soft delete)
exports.deleteBQP = async (req, res) => {
    try {
        const deletedBQP = await BQPModel.findByIdAndUpdate(
            req.params.id,
            { delete: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedBQP) {
            return res.status(404).json({ success: false, message: "BQP not found" });
        }
        res.status(200).json({ success: true, message: "BQP deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting BQP", error: error.message });
    }
};
