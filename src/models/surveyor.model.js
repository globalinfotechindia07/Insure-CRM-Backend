const mongoose = require("mongoose");

const surveyorSchema = new mongoose.Schema(
  {
    // Surveyor Name
    surveyorName: {
      type: String,
      required: true,
      trim: true,
    },

    // License Number
    licenseNo: {
      type: String,
      required: true,
      trim: true,
    },

    // License Expiry Date
    expiryDate: {
      type: Date,
      required: true,
    },

    // Categories of License
    categories: [
      {
        type: String,
        trim: true,
      },
    ],

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

    // Active / Inactive
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
  "Surveyor",
  surveyorSchema
);