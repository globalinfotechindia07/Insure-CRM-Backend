const BQPModel = require('../../../models/Masters/POSAndBQP/BQP.model');
const BQPPatternModel = require('../../../models/Masters/POSAndBQP/BQPPattern.model');
const path = require("path");
const csv = require("csvtojson");
const XLSX = require("xlsx");

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

// Delete a BQP entry (permanent delete)
exports.deleteBQP = async (req, res) => {
    try {
        const deletedBQP = await BQPModel.findByIdAndDelete(req.params.id);
        if (!deletedBQP) {
            return res.status(404).json({ success: false, message: "BQP not found" });
        }
        res.status(200).json({ success: true, message: "BQP deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting BQP", error: error.message });
    }
};

// Export BQP to Excel
exports.exportCsv = async (req, res) => {
    try {
        const bqpList = await BQPModel.find({ delete: false }).sort({ createdAt: -1 });
        
        const excelData = bqpList.map(bqp => ({
            "BQP Name": bqp.bqpName || "",
            "Address": bqp.address || "",
            "Contact Number": bqp.contactNumber || "",
            "Email ID": bqp.emailId || "",
            "Code Number": bqp.codeNumber || "",
            "Aadhar Number": bqp.aadharNumber || "",
            "PAN Number": bqp.panNumber || "",
            "Last Training Attended": bqp.lastTrainingAttended ? bqp.lastTrainingAttended.toISOString().split('T')[0] : "",
            "Next Training Due Date": bqp.nextTrainingDueDate ? bqp.nextTrainingDueDate.toISOString().split('T')[0] : "",
            "Reminder Alerts": bqp.reminderAlerts ? "Yes" : "No"
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "BQP");
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=bqp.xlsx");
        res.status(200).send(buffer);
    } catch (error) {
        console.error("Error exporting BQP:", error);
        res.status(500).send("An error occurred while exporting the data.");
    }
};

// Import BQP from Excel/CSV
exports.importCsv = async (req, res) => {
    try {
        if (!req.file?.path) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        if (ext === ".csv") {
            rows = await csv().fromFile(req.file.path);
        } else if (ext === ".xlsx" || ext === ".xls") {
            const wb = XLSX.readFile(req.file.path);
            const sheet = wb.Sheets[wb.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        } else {
            return res.status(400).json({ error: "Unsupported file type" });
        }

        let importedCount = 0;
        let skippedCount = 0;
        for (const row of rows) {
            const excelCodeNumber = row["Code Number"] ? String(row["Code Number"]).trim() : "";
            
            if (excelCodeNumber) {
                const existing = await BQPModel.findOne({ codeNumber: excelCodeNumber });
                if (existing) {
                    skippedCount++;
                    continue; // Skip duplicate code number
                }
            }

            let codeNumber = excelCodeNumber;
            if (!codeNumber) {
                // Auto-generate codeNumber
                const pattern = await BQPPatternModel.findOneAndUpdate(
                    {},
                    { $inc: { nextSequence: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                
                const padding = pattern.paddingSize || 3;
                const currentSeq = pattern.nextSequence - 1;
                const sequenceStr = currentSeq.toString().padStart(padding, '0');
                codeNumber = `${pattern.prefix || 'BQP-'}${sequenceStr}`;
            }

            const data = {
                bqpName: row["BQP Name"] || "",
                address: row["Address"] || "",
                contactNumber: String(row["Contact Number"] || ""),
                emailId: row["Email ID"] || "",
                codeNumber: codeNumber,
                aadharNumber: String(row["Aadhar Number"] || ""),
                panNumber: row["PAN Number"] || "",
                lastTrainingAttended: row["Last Training Attended"] ? new Date(row["Last Training Attended"]) : null,
                nextTrainingDueDate: row["Next Training Due Date"] ? new Date(row["Next Training Due Date"]) : null,
                reminderAlerts: String(row["Reminder Alerts"]).toLowerCase() === 'yes'
            };

            const newBQP = new BQPModel(data);
            await newBQP.save();
            importedCount++;
        }

        res.status(200).json({ success: true, message: `Successfully imported ${importedCount} BQP records. Skipped ${skippedCount} duplicates.` });
    } catch (error) {
        console.error("Error importing BQP:", error);
        res.status(500).json({ success: false, message: "Error importing BQP data", error: error.message });
    }
};
