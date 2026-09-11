const mongoose = require("mongoose");

const leaveManagerSchema = new mongoose.Schema(
  {
    staffName: { type: String, required: true },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leaveType",
      required: true,
    },
    status: { type: String, default: "Applied" },
    leaveMode: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
    noOfDays: { type: Number, required: true },
    alternateMobileNo: { type: String },
    reason: { type: String, required: true },
    rejectReason: { type: String },
  },
  { timestamps: true }
);

const leaveManagerModel = mongoose.model("leaveManager", leaveManagerSchema);

module.exports = leaveManagerModel;
