const POSModel = require('../../../models/Masters/POSAndBQP/POS.model');
const POSPatternModel = require('../../../models/Masters/POSAndBQP/POSPattern.model');
const path = require("path");
const csv = require("csvtojson");
const XLSX = require("xlsx");

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

// Delete a POS entry (permanent delete)
exports.deletePOS = async (req, res) => {
    try {
        const deletedPOS = await POSModel.findByIdAndDelete(req.params.id);
        if (!deletedPOS) {
            return res.status(404).json({ success: false, message: "POS not found" });
        }
        res.status(200).json({ success: true, message: "POS deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting POS", error: error.message });
    }
};

// Export POS to Excel
exports.exportCsv = async (req, res) => {
    try {
        const posList = await POSModel.find({ delete: false }).sort({ createdAt: -1 });
        
        const excelData = posList.map(pos => ({
            "POS Name": pos.posName || "",
            "Address": pos.address || "",
            "Contact Number": pos.contactNumber || "",
            "Email ID": pos.emailId || "",
            "Code Number": pos.codeNumber || "",
            "Aadhar Number": pos.aadharNumber || "",
            "PAN Number": pos.panNumber || "",
            "Last Training Attended": pos.lastTrainingAttended ? pos.lastTrainingAttended.toISOString().split('T')[0] : "",
            "Next Training Due Date": pos.nextTrainingDueDate ? pos.nextTrainingDueDate.toISOString().split('T')[0] : "",
            "Reminder Alerts": pos.reminderAlerts ? "Yes" : "No"
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "POS");
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=pos.xlsx");
        res.status(200).send(buffer);
    } catch (error) {
        console.error("Error exporting POS:", error);
        res.status(500).send("An error occurred while exporting the data.");
    }
};

// Import POS from Excel/CSV
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
                const existing = await POSModel.findOne({ codeNumber: excelCodeNumber });
                if (existing) {
                    skippedCount++;
                    continue; // Skip duplicate code number
                }
            }

            let codeNumber = excelCodeNumber;
            if (!codeNumber) {
                // Auto-generate codeNumber
                const pattern = await POSPatternModel.findOneAndUpdate(
                    {},
                    { $inc: { nextSequence: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                
                const padding = pattern.paddingSize || 3;
                const currentSeq = pattern.nextSequence - 1;
                const sequenceStr = currentSeq.toString().padStart(padding, '0');
                codeNumber = `${pattern.prefix || 'POS-'}${sequenceStr}`;
            }

            const data = {
                posName: row["POS Name"] || "",
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

            const newPOS = new POSModel(data);
            await newPOS.save();
            importedCount++;
        }

        res.status(200).json({ success: true, message: `Successfully imported ${importedCount} POS records. Skipped ${skippedCount} duplicates.` });
    } catch (error) {
        console.error("Error importing POS:", error);
        res.status(500).json({ success: false, message: "Error importing POS data", error: error.message });
    }
};
