const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    // =========================================
    // BASIC DETAILS
    // =========================================

    claimNo: {
      type: String,
      trim: true,
    },

    customerType: String, // CORPORATE / RETAIL (flexible)

    department: String,

    status: {
      type: String,
      default: "Pending",
    },

    remarks: String,
    
    healthClaimType: {
      type: String,
      enum: ["REIMBURSEMENT", "CASHLESS", "PRE-POST", ""],
      default: "",
    },

    // =========================================
    // POLICY INTEGRATION (AUTO FILL)
    // =========================================

    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "policyDetail",
    },

    policyNo: String,

    insuredName: String,
    
    patientName: {
      type: String,
      trim: true,
    },

    contactNo: String,

    policyDepartment: String,

    locationOfProperty: String,

    typeOfPolicy: String,

    insurerName: String,

    vehicleNumber: String,

    // =========================================
    // CLAIM MAIN DETAILS (UPDATED)
    // =========================================

    // Date of Loss / Admission
    dateOfLossOrAdmission: {
      type: Date,
      required: false,
    },

    // Date of discharge
    dateOfDischarge: {
      type: Date,
      required: false,
    },

    // Date of Registration
    dateOfRegistration: {
      type: Date,
      required: false,
    },

    // Date of Intimation
    dateOfIntimation: {
      type: Date,
      required: false,
    },

    // Loss Description
    lossDescription: {
      type: String,
      trim: true,
    },

    // Estimated loss Amount
    estimatedLossAmount: {
      type: Number,
      default: 0,
    },

    // Cause of Loss
    causeOfLoss: {
      type: String,
      trim: true,
    },

    // =========================================
    // SURVEYOR / TPA / INVESTIGATOR (UPDATED)
    // =========================================

    // Name of the preliminary/Spot Surveyor
    preliminarySurveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Surveyor",
    },

    preliminarySurveyorName: {
      type: String,
      trim: true,
    },

    // Name of the Final Surveyor
    finalSurveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Surveyor",
    },

    finalSurveyorName: {
      type: String,
      trim: true,
    },

    // Surveyor Mob No
    surveyorMobNo: {
      type: String,
      trim: true,
    },

    // Spot Survey Description
    spotSurvey: {
      type: String,
      trim: true,
    },

    // Name of the TPA
    tpaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TPA",
    },

    tpaName: {
      type: String,
      trim: true,
    },

    // =========================================
    // TRANSPORT / MARINE DETAILS (UPDATED)
    // =========================================

    // Date of Invoice
    dateOfInvoice: {
      type: Date,
      required: false,
    },

    // Invoice No.
    invoiceNo: {
      type: String,
      trim: true,
    },

    // =========================================
    // ADDITIONAL FIELDS (for compatibility)
    // =========================================

    claimAmount: Number,
    approvedAmount: Number,
    totalAmountDeducted: Number,
    admissionDate: Date,
    dischargeDate: Date,
    approvalDate: Date,
    settlementDate: Date,

    // Investigator
    investigatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investigator",
    },
    investigatorName: String,

    typeOfSurvey: {
      type: String,
      enum: ["Spot", "Preliminary", "Final", "SPOT", "PRELIMINARY", "FINAL", ""],
      default: "",
    },

    // Marine Fields
    billOfLadingNo: String,
    portOfLoading: String,
    portOfDischarge: String,
    descriptionOfGoods: String,
    voyageFrom: String,
    voyageTo: String,
    typeOfCargo: String,
    nameOfVessel: String,
    typeOfLoss: String,

    // Motor Fields
    nameOfDriver: String,

    // Engineering Fields
    assetMachineryId: String,

    // Health Fields
    relationshipToPolicyholder: String,
    hospitalNameAndAddress: String,
    admissionTime: String,
    tpaContactNo: String,
    tpaEmail: String,

    periodOfInsurance: String,
    sumInsured: String,
    surveyorEmail: String,
    investigatorContactNo: String,
    investigatorEmail: String,

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