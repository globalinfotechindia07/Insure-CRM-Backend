const POSModel = require('../../../models/Masters/POSAndBQP/POS.model');
const POSPatternModel = require('../../../models/Masters/POSAndBQP/POSPattern.model');

// Create a new POS entry
exports.createPOS = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Auto-generate codeNumber
        const pattern = await POSPatternModel.findOneAndUpdate(
            {},
            { $inc: { nextSequence: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        const padding = pattern.paddingSize || 3;
        const currentSeq = pattern.nextSequence - 1;
        const sequenceStr = currentSeq.toString().padStart(padding, '0');
        data.codeNumber = `${pattern.prefix || 'POS-'}${sequenceStr}`;

        const newPOS = new POSModel(data);
        const savedPOS = await newPOS.save();
        res.status(201).json({ success: true, message: "POS created successfully", data: savedPOS });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating POS", error: error.message });
    }
};

// Get all POS entries
exports.getAllPOS = async (req, res) => {
    try {
        const posList = await POSModel.find({ delete: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: "POS fetched successfully", data: posList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching POS", error: error.message });
    }
};

// Get POS entry by ID
exports.getPOSById = async (req, res) => {
    try {
        const pos = await POSModel.findById(req.params.id);
        if (!pos || pos.delete) {
            return res.status(404).json({ success: false, message: "POS not found" });
        }
        res.status(200).json({ success: true, message: "POS fetched successfully", data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching POS", error: error.message });
    }
};

// Update a POS entry
exports.updatePOS = async (req, res) => {
    try {
        const updatedPOS = await POSModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedPOS) {
            return res.status(404).json({ success: false, message: "POS not found" });
        }
        res.status(200).json({ success: true, message: "POS updated successfully", data: updatedPOS });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating POS", error: error.message });
    }
};

// Delete a POS entry (soft delete)
exports.deletePOS = async (req, res) => {
    try {
        const deletedPOS = await POSModel.findByIdAndUpdate(
            req.params.id,
            { delete: true, deletedAt: new Date() },
            { new: true }
        );
        if (!deletedPOS) {
            return res.status(404).json({ success: false, message: "POS not found" });
        }
        res.status(200).json({ success: true, message: "POS deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting POS", error: error.message });
    }
};
