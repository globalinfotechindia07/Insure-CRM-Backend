const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    // =========================================
    // BASIC DETAILS
    // =========================================

    claimNo: {
      type: String,
      required: true,
      trim: true,
    },

    customerType: String, // CORPORATE / RETAIL (flexible)

    department: String,

    status: {
      type: String,
      default: "Pending",
    },

    remarks: String,

    // =========================================
    // POLICY INTEGRATION (AUTO FILL)
    // =========================================

    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
    },

    policyNo: String,

    insuredName: String,

    contactNo: String,

    email: String,

    contactPerson: String,

    policyDepartment: String,

    locationOfProperty: String,

    renewalOrNewPolicy: String,

    typeOfPolicy: String,

    wording: String,

    additionalWordings: String,

    financialInstitutionsAndLenders: String,

    briefDescriptionOfProperty: String,

    sumInsured: Number,

    periodOfInsurance: String,

    insurerName: String,

    vehicleNumber: String,

    netPremium: Number,

    gst: Number,

    totalAmount: Number,

    paymentMode: String,

    // =========================================
    // CLAIM MAIN DETAILS
    // =========================================

    claimAmount: Number,

    estimatedLossAmount: Number,

    approvedAmount: Number,

    causeOfLoss: String,

    machineryDetails: String,

    settlementType: String, // Standard / Non-Standard / Repudiate

    // =========================================
    // IMPORTANT DATES
    // =========================================

    dateOfLoss: Date,

    admissionDate: Date,

    dischargeDate: Date,

    approvalDate: Date,

    settlementDate: Date,

    // =========================================
    // SURVEYOR / TPA / INVESTIGATOR
    // =========================================

    surveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Surveyor",
    },

    finalSurveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Surveyor",
    },

    tpaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TPA",
    },

    investigatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investigator",
    },

    // =========================================
    // TRANSPORT / MARINE DETAILS
    // =========================================

    invoiceNo: String,

    billOfLadingNo: String,

    lrNo: String,

    insuranceCertificateNo: String,

    journeyFrom: String,

    journeyTo: String,

    surveyorReferenceNumber: String,

    // =========================================
    // POST HOSPITALIZATION CLAIM (SEPARATE BLOCK)
    // =========================================

    postHospitalization: {
      dischargeDate: Date,

      amountClaimed: Number,

      noOfDays: Number,
    },

    // =========================================
    // ACTIVE STATUS
    // =========================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Claim", claimSchema);