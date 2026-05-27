const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    policyNo: String,

    corporateType: String,

    department: String,

    insuredName: String,

    contactNo: String,

    email: String,

    contactPerson: String,

    location: String,

    renewalType: String,

    policyType: String,

    wording: String,

    additionalWordings: String,

    lenders: String,

    propertyDescription: String,

    sumInsured: Number,

    insurerName: String,

    insuranceCompany: String,  // ✅ ADDED - Insurance Company Name

    vehicleNumber: String,

    premium: Number,

    gst: Number,

    totalAmount: Number,

    modeOfPayment: String,

    startDate: Date,

    endDate: Date,

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
  "Policy",
  policySchema
);