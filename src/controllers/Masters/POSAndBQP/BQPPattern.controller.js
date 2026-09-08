const BQPPatternModel = require('../../../models/Masters/POSAndBQP/BQPPattern.model');

// Get current BQP pattern
exports.getPattern = async (req, res) => {
    try {
        let pattern = await BQPPatternModel.findOne();
        if (!pattern) {
            // Create default pattern if not exists
            pattern = await BQPPatternModel.create({
                prefix: 'BQP-',
                nextSequence: 1,
                paddingSize: 3
            });
        }
        res.status(200).json({ success: true, message: "Pattern fetched successfully", data: pattern });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching pattern", error: error.message });
    }
};

// Update BQP pattern
exports.updatePattern = async (req, res) => {
    try {
        const { prefix, nextSequence, paddingSize } = req.body;
        
        let pattern = await BQPPatternModel.findOne();
        if (!pattern) {
            pattern = new BQPPatternModel({ prefix, nextSequence, paddingSize });
        } else {
            pattern.prefix = prefix !== undefined ? prefix : pattern.prefix;
            pattern.nextSequence = nextSequence !== undefined ? nextSequence : pattern.nextSequence;
            pattern.paddingSize = paddingSize !== undefined ? paddingSize : pattern.paddingSize;
        }
        
        await pattern.save();
        res.status(200).json({ success: true, message: "Pattern updated successfully", data: pattern });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating pattern", error: error.message });
    }
};
