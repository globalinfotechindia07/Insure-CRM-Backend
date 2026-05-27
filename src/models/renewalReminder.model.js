const mongoose = require("mongoose");

const renewalReminderSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    contactNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    policyNo: {
      type: String,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reminderDate: {
      type: Date,
      required: true,
    },
    reminderDays: {
      type: Number,
      default: 7,
    },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RenewalReminder", renewalReminderSchema);