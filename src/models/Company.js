const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
  }
);

// Create index for better performance
companySchema.index({ name: 1 });
companySchema.index({ status: 1 });

const companyModel = mongoose.model("Company", companySchema);
module.exports = companyModel;