const mongoose = require("mongoose");

const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number") return isNaN(v) ? null : v;
  if (typeof v === "string") {
    const cleaned = v.replace(/,/g, "").trim();
    if (cleaned === "") return null;
    const parsed = Number(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return v;
};

const policyDetailSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    financialYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "financialYear",
      set: (v) => (v === "" ? null : v),
    },
    clientType: {
      type: String,
      //   required: true,
      trim: true,
      //   maxlength: 100,
    },
    retailCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customerRegistration",
      set: (v) => (v === "" ? null : v),
    },
    customerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customerGroup",
      set: (v) => (v === "" ? null : v),
    },
    subCustomerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCustomerGroup",
      set: (v) => (v === "" ? null : v),
    },
    checkSubGroupGroup: {
      type: String,
    },
    branchCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BrokerBranch",
      set: (v) => (v === "" ? null : v),
    },
    branchName: {
      type: String,
    },
    prefix: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prefix",
      set: (v) => (v === "" ? null : v),
    },
    cutomerName: {
      type: String,
    },
    mobile: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    insurerName: {
      type: String,
    },
    gstNo: {
      type: String,
      trim: true,
      uppercase: true,
    },
    showNominee: {
      type: Boolean,
    },
    nomineeName: {
      type: String,
    },
    nomineeRelation: {
      type: String,
    },
    nomineeContact: {
      type: String,
    },
    insDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "insDepartment",
      set: (v) => (v === "" ? null : v),
    },
    insCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "insCompany",
      set: (v) => (v === "" ? null : v),
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOrServiceCategory",
      set: (v) => (v === "" ? null : v),
    },
    subProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubProductCategory",
      set: (v) => (v === "" ? null : v),
    },
    brokerName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brokerName",
      set: (v) => (v === "" ? null : v),
    },
    branchBroker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branchBroker",
      set: (v) => (v === "" ? null : v),
    },
    tpPolicyDuration: {
      type: String,
    },
    tpStartDate: {
      type: Date,
    },
    tpEndDate: {
      type: mongoose.Schema.Types.Mixed,
    },
    tpPremium: {
      type: String,
    },
    tpGst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstPercentage",
      set: (v) => (v === "" ? null : v),
    },
    tpGstAmount: {
      type: String,
    },
    tpAmount: {
      type: String,
    },
    odPolicyDuration: {
      type: String,
    },
    odStartDate: {
      type: Date,
    },
    odEndDate: {
      type: mongoose.Schema.Types.Mixed,
    },
    odPremium: {
      type: String,
    },
    odGst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstPercentage",
      set: (v) => (v === "" ? null : v),
    },
    odGstAmount: {
      type: String,
    },
    odAmount: {
      type: String,
    },
    policyNumber: {
      type: String,
    },
    renewalDate: {
      type: mongoose.Schema.Types.Mixed,
    },
    sumInsured: {
      type: Number,
      set: parseNumber,
    },
    renewable: {
      type: String,
    },
    numberOfInstallments: {
      type: String,
    },
    livesCover: {
      type: String,
    },
    nextInstallmentDate: {
      type: Date,
    },
    policyDuration: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: mongoose.Schema.Types.Mixed,
    },
    riskCode: {
      type: String,
    },
    otherAddon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "otherAddon",
      set: (v) => (v === "" ? null : v),
    },
    terrirism: {
      type: String,
    },
    netPremium: {
      type: Number,
      set: parseNumber,
    },
    gst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstPercentage",
      set: (v) => (v === "" ? null : v),
    },
    gstAmount: {
      type: Number,
      set: parseNumber,
    },

    totalAmount: {
      type: Number,
      set: parseNumber,
    },
    siteLocation: {
      type: String,
    },
    numberOfInstallments: {
      type: String,
    },
    occupation: {
      type: String,
    },
    retroActive: {
      type: String,
    },
    incoterms: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "incoterms",
      set: (v) => (v === "" ? null : v),
    },
    marineClause: {
      type: String,
    },
    terrorism: {
      type: String,
    },
    permiumOtherThanTerrorism: {
      type: String,
    },
    totalAmount: {
      type: String,
    },
    vehicleMake: {
      type: String,
    },
    vehicleModel: {
      type: String,
    },
    vehicleSubModel: {
      type: String,
    },
    vehicleNumber: {
      type: String,
    },
    engineNumber: {
      type: String,
    },
    monthYearOfRegn: {
      type: String,
    },
    fuelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "fuelType",
      set: (v) => (v === "" ? null : v),
    },
    yearOfManufacturing: {
      type: String,
    },
    chassisNumber: {
      type: String,
    },

    endorsementName: {
      type: String,
    },
    endorsementReason: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "endorsement",
      set: (v) => (v === "" ? null : v),
    },
    endorsementPolicyNumber: {
      type: String,
    },
    endorStartDate: {
      type: Date,
    },
    endorEndDate: {
      type: Date,
    },
    endorsementTerrorism: {
      type: String,
    },
    endorsementOtherTerrorism: {
      type: String,
    },
    endorsementNetPremium: {
      type: Number,
      set: parseNumber,
    },
    endorsementGst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstPercentage",
      set: (v) => (v === "" ? null : v),
    },
    endorsementGstAmount: {
      type: Number,
      set: parseNumber,
    },
    paymentMode: {
      type: String,
    },
    etotalAmount: {
      type: Number,
      set: parseNumber,
    },
    chequeNo: {
      type: String,
    },
    paidAmount: {
      type: Number,
      set: parseNumber,
    },
    transactionDate: {
      type: Date,
    },
    posMisRef: {
      type: String,
    },
    bqpCode: {
      type: String,
    },
    rateOnOtherTerr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brokerageRate",
      set: (v) => (v === "" ? null : v),
    },
    amountOnOtherTerr: {
      type: Number,
      set: parseNumber,
    },
    rateOnTerr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brokerageRate",
      set: (v) => (v === "" ? null : v),
    },
    amountOnTerr: {
      type: Number,
      set: parseNumber,
    },
    tpBrokerageRate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brokerageRate",
      set: (v) => (v === "" ? null : v),
    },
    tpBrokerageAmount: {
      type: Number,
      set: parseNumber,
    },
    odBrokerageRate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brokerageRate",
      set: (v) => (v === "" ? null : v),
    },
    odBrokerageAmount: {
      type: Number,
      set: parseNumber,
    },
    totalBrokerageAmount: {
      type: Number,
      set: parseNumber,
    },
    totalBrokerageGst: {
      type: Number,
      set: parseNumber,
    },
    totalBrokerageAmountincGst: {
      type: Number,
      set: parseNumber,
    },
    sharePercentage: {
      type: Number,
      set: parseNumber,
    },
    coBrokerageAmount: {
      type: Number,
      set: parseNumber,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    createdBy: mongoose.Types.ObjectId,
  },
  { timestamps: true }
);

policyDetailSchema.index(
  { companyId: 1, policyNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      policyNumber: { $exists: true, $type: "string", $gt: "" }
    }
  }
);

const policyDetailModel = mongoose.model("policyDetail", policyDetailSchema);

module.exports = policyDetailModel;
