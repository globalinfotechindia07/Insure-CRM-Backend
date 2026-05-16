const mongoose = require("mongoose");

const investigatorSchema = new mongoose.Schema(
  {
    investigatorName: {
      type: String,
      required: true,
    },

    labName: {
      type: String,
    },

    contactNo: {
      type: String,
    },

    email: {
      type: String,
    },

    address: {
      type: String,
    },

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
  "Investigator",
  investigatorSchema
);