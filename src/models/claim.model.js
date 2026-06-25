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
      ref: "policyDetail",
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

    // Claim Approved Amount
    claimApprovedAmount: {
      type: Number,
      default: 0,
    },

    machineryDetails: {
      type: String,
      trim: true,
    },

    // Type of settlement [Standard / Non-Standard / Repudiate]
    settlementType: {
      type: String,
      enum: ["Standard", "Non-Standard", "Repudiate"],
      default: "Standard",
    },

    // =========================================
    // IMPORTANT DATES (UPDATED)
    // =========================================

    // Date of Approval of claim
    dateOfApprovalOfClaim: {
      type: Date,
      required: false,
    },

    // Date of settlement
    dateOfSettlement: {
      type: Date,
      required: false,
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

    // Name of the TPA
    tpaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TPA",
    },

    tpaName: {
      type: String,
      trim: true,
    },

    // Name of the Investigator/Forensic Lab
    investigatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investigator",
    },

    investigatorName: {
      type: String,
      trim: true,
    },

    // =========================================
    // TRANSPORT / MARINE DETAILS (UPDATED)
    // =========================================

    // Invoice No.
    invoiceNo: {
      type: String,
      trim: true,
    },

    // Bill of lading No.
    billOfLadingNo: {
      type: String,
      trim: true,
    },

    // LR No.
    lrNo: {
      type: String,
      trim: true,
    },

    // Insurance Certificate No.
    insuranceCertificateNo: {
      type: String,
      trim: true,
    },

    // Journey/Voyage From
    journeyFrom: {
      type: String,
      trim: true,
    },

    // Journey/Voyage To
    journeyTo: {
      type: String,
      trim: true,
    },

    // Surveyor/Loss Adjuster Reference Number WKW
    surveyorReferenceNumber: {
      type: String,
      trim: true,
    },

    // =========================================
    // POST HOSPITALIZATION CLAIM (UPDATED)
    // =========================================

    postHospitalization: {
      // Date of Discharge
      dischargeDate: {
        type: Date,
        required: false,
      },

      // Amount Claimed
      amountClaimed: {
        type: Number,
        default: 0,
      },

      // No of Days
      noOfDays: {
        type: Number,
        default: 0,
      },
    },

    // =========================================
    // ADDITIONAL FIELDS (for compatibility)
    // =========================================

    claimAmount: Number,
    approvedAmount: Number,
    admissionDate: Date,
    dischargeDate: Date,
    approvalDate: Date,
    settlementDate: Date,

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