const mongoose = require("mongoose");

const tpaSchema = new mongoose.Schema(
  {
    // TPA Name
    tpaName: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact Number
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },

    // Email ID
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Address
    address: {
      type: String,
      trim: true,
    },

    // Status
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TPA",
  tpaSchema
);