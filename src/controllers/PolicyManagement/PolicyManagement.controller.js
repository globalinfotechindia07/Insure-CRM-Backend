const mongoose = require("mongoose");
const {
  policyDetailModel,
  insDepartmentModel,
  insCompanyModel,
  financialYearModel,
  CustomerRegistrationModel,
  customerGroupModel,
  GstPercentageModel,
  PrefixModel,
  SubProductCategoryModel,
  subCustomerGroupModel,
  brokerBranch,
  brokerNameModel,
  branchBrokerModel,
  fuelTypeModel,
  incotermsModel,
  otherAddonModel,
  endorsementModel,
  riskCodeModel,
  CompanyModel,
  PaymentModeModel,
  brokerageRateModel
} = require("../../models/index");
const ProductOrServiceCategorymodel = require("../../models/Masters/ProductOrServiceCategory/ProductOrServiceCategory.model");
const RenewalReminder = require("../../models/renewalReminder.model");
const axios = require("axios");
const Customer = require("../../models/Customer");

const csv = require("csvtojson");
const XLSX = require("xlsx");
const path = require("path");
const { Parser: CsvParser } = require("json2csv");

//get the count of policies
const getPolicyCount = async (req, res) => {
  try {
    console.log("count contrioller initiated  ");
    const { companyId } = req.query;
    const query = {};
    if (companyId && mongoose.Types.ObjectId.isValid(companyId) && companyId !== "68c07ddaeb160d097128c5af") {
      query.companyId = new mongoose.Types.ObjectId(companyId);
    }

    const count = await policyDetailModel.countDocuments(query);

    console.log("response ", count);

    if (count === 0) {
      return res.status(404).json({ message: "No policy details found" });
    }

    return res.status(200).json({ status: "true", count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get policy details by FY
const getPolicyDetailByFY = async (req, res) => {
  try {
    // console.log("API connected... ");
    const { financialYear, companyId } = req.query;

    const query = {
      financialYear: new mongoose.Types.ObjectId(financialYear),
    };
    if (companyId && mongoose.Types.ObjectId.isValid(companyId) && companyId !== "68c07ddaeb160d097128c5af") {
      query.companyId = new mongoose.Types.ObjectId(companyId);
    }

    const policyDetail = await policyDetailModel
      .find(query)
      .populate("insDepartment")
      .populate("insCompany");
    // .populate("ProductOrServiceCategory");

    // .populate("financialYear");

    // console.log("------------------------------------------", policyDetail);

    if (!policyDetail || policyDetail.length === 0) {
      return res.status(404).json({ message: "policy detail not found" });
    }

    // sort data from newest to oldest
    policyDetail.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt), // b is newer, a is older
    );

    return res.status(200).json({ status: "true", data: policyDetail });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get policy details
const getPolicyDetail = async (req, res) => {
  try {
    const { policyNumber, companyId } = req.query;

    const query = {};
    if (companyId && mongoose.Types.ObjectId.isValid(companyId) && companyId !== "68c07ddaeb160d097128c5af") {
      query.$or = [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: null },
        { companyId: { $exists: false } }
      ];
    }
    if (policyNumber) {
      query.policyNumber = policyNumber;
    }

    const policyDetail = await policyDetailModel
      .find(query)
      .populate("insDepartment")
      .populate("insCompany")
      .populate("retailCustomer")
      .populate("customerGroup")
      .sort({ createdAt: -1 });

    if (!policyDetail || policyDetail.length === 0) {
      return res.status(200).json({ status: "true", data: [] });
    }

    // Deduplicate policy details strictly by _id so no distinct document is hidden
    const seenIds = new Set();
    const uniquePolicies = [];

    for (const policy of policyDetail) {
      const idStr = String(policy._id);
      if (seenIds.has(idStr)) continue;
      seenIds.add(idStr);
      uniquePolicies.push(policy);
    }

    return res.status(200).json({ status: "true", data: uniquePolicies });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const ensureCustomerExists = async (body, companyId) => {
  const toLowerSafe = (val) =>
    val !== undefined && val !== null ? String(val).toLowerCase().trim() : "";

  const clientType = toLowerSafe(body.clientType) || "retail";
  const cutomerName = String(body.cutomerName || "").trim();
  const mobile = String(body.mobile || "").trim();
  const email = String(body.email || "").trim();
  const gstNo = String(body.gstNo || "").trim();

  if (!cutomerName) {
    return { retailCustomer: body.retailCustomer, customerGroup: body.customerGroup };
  }

  const insuredNameKey = toLowerSafe(cutomerName);
  let retailCustomer = body.retailCustomer || undefined;
  let customerGroup = body.customerGroup || undefined;

  const cleanCompanyId = (companyId && mongoose.Types.ObjectId.isValid(companyId))
    ? companyId
    : "68ca95091d6a9cc2b96ae263";

  if (clientType === "corporate") {
    let existingGroup = null;
    if (customerGroup && mongoose.Types.ObjectId.isValid(customerGroup)) {
      existingGroup = await customerGroupModel.findById(customerGroup);
    }
    
    if (!existingGroup) {
      existingGroup = await customerGroupModel.findOne({
        customerGroupName: { $regex: new RegExp(`^${cutomerName}$`, "i") }
      });
    }

    if (existingGroup) {
      customerGroup = existingGroup._id;
    } else {
      const newGroup = new customerGroupModel({
        companyId: cleanCompanyId,
        customerGroupName: cutomerName,
        email: email,
        mobile: mobile,
        gstNo: gstNo,
        createdBy: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : undefined
      });
      const savedGroup = await newGroup.save();
      customerGroup = savedGroup._id;

      // Sync with Customer Master
      try {
        const legacyCustomer = new Customer({
          clientType: "corporate",
          customerId: "GRP" + Date.now(),
          customerName: cutomerName,
          email: email,
          mobile: mobile,
          gst: gstNo
        });
        await legacyCustomer.save();
      } catch (err) {
        console.error("Error saving corporate group to Customer Master:", err);
      }
    }
  } else {
    let existingCustomer = null;
    if (retailCustomer && mongoose.Types.ObjectId.isValid(retailCustomer)) {
      existingCustomer = await CustomerRegistrationModel.findById(retailCustomer);
    }
    
    if (!existingCustomer) {
      const matchConditions = [
        { name: { $regex: new RegExp(`^${cutomerName}$`, "i") } }
      ];
      if (mobile) {
        matchConditions.push({ mobile: mobile });
      }
      if (email) {
        matchConditions.push({ email: email.toLowerCase() });
      }
      existingCustomer = await CustomerRegistrationModel.findOne({
        $or: matchConditions
      });
    }

    if (existingCustomer) {
      retailCustomer = existingCustomer._id;
    } else {
      const lastCustomer = await CustomerRegistrationModel.findOne().sort({ createdAt: -1 });
      let nextId = "CUST001";
      if (lastCustomer && lastCustomer.customerId) {
        const lastNum = parseInt(lastCustomer.customerId.replace("CUST", ""));
        if (!isNaN(lastNum)) {
          nextId = `CUST${String(lastNum + 1).padStart(3, "0")}`;
        }
      }

      const newCustomer = new CustomerRegistrationModel({
        customerType: "retail",
        customerId: nextId,
        name: cutomerName,
        email: email,
        mobile: mobile,
        gstNo: gstNo,
        doj: new Date(),
        createdBy: companyId ? new mongoose.Types.ObjectId(companyId) : undefined
      });
      const savedCustomer = await newCustomer.save();
      retailCustomer = savedCustomer._id;

      // Sync with Customer Master
      try {
        const legacyCustomer = new Customer({
          clientType: "retail",
          customerId: nextId,
          customerName: cutomerName,
          email: email,
          mobile: mobile,
          gst: gstNo
        });
        await legacyCustomer.save();
      } catch (err) {
        console.error("Error saving retail customer to Customer Master:", err);
      }
    }
  }

  return { retailCustomer, customerGroup };
};

const ensureMastersExist = async (body, companyId) => {
  const cleanCompanyId = (companyId && mongoose.Types.ObjectId.isValid(companyId))
    ? companyId
    : "68ca95091d6a9cc2b96ae263";

  const resolved = {};

  // Branch Code
  if (body.branchCode && typeof body.branchCode === "string" && !mongoose.Types.ObjectId.isValid(body.branchCode)) {
    const clean = body.branchCode.trim();
    if (clean) {
      let doc = await brokerBranch.findOne({
        $or: [
          { branchCode: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
          { branchName: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } }
        ]
      });
      if (!doc) {
        doc = await brokerBranch.create({ branchCode: clean, branchName: clean, companyId: cleanCompanyId });
      }
      resolved.branchCode = doc._id;
    }
  }

  // Prefix
  if (body.prefix && typeof body.prefix === "string" && !mongoose.Types.ObjectId.isValid(body.prefix)) {
    const clean = body.prefix.trim();
    if (clean) {
      let doc = await PrefixModel.findOne({ prefix: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await PrefixModel.create({ prefix: clean, companyId: cleanCompanyId });
      }
      resolved.prefix = doc._id;
    }
  }

  // Insurer / Insurance Company
  if (body.insCompany && typeof body.insCompany === "string" && !mongoose.Types.ObjectId.isValid(body.insCompany)) {
    const clean = body.insCompany.trim();
    if (clean) {
      let doc = await insCompanyModel.findOne({ insCompany: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await insCompanyModel.create({ insCompany: clean, companyId: cleanCompanyId });
      }
      resolved.insCompany = doc._id;

      // Sync with CompanyModel (powers http://localhost:3000/master/company)
      try {
        const cleanNameUpper = clean.toUpperCase();
        const existingAdminComp = await CompanyModel.findOne({ name: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
        if (!existingAdminComp) {
          await CompanyModel.create({
            name: cleanNameUpper,
            description: "Created from Policy Management",
            status: "active"
          });
        }
      } catch (adminCompErr) {
        console.error("Error syncing company to CompanyModel:", adminCompErr);
      }
    }
  }

  // Ins Department
  if (body.insDepartment && typeof body.insDepartment === "string" && !mongoose.Types.ObjectId.isValid(body.insDepartment)) {
    const clean = body.insDepartment.trim();
    if (clean) {
      let doc = await insDepartmentModel.findOne({ insDepartment: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await insDepartmentModel.create({ insDepartment: clean, companyId: cleanCompanyId });
      }
      resolved.insDepartment = doc._id;
    }
  }

  // Product
  if (body.product && typeof body.product === "string" && !mongoose.Types.ObjectId.isValid(body.product)) {
    const clean = body.product.trim();
    if (clean) {
      let doc = await ProductOrServiceCategorymodel.findOne({ productName: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await ProductOrServiceCategorymodel.create({ productName: clean, insDepartment: resolved.insDepartment || body.insDepartment, companyId: cleanCompanyId });
      }
      resolved.product = doc._id;
    }
  }

  // Broker Name
  if (body.brokerName && typeof body.brokerName === "string" && !mongoose.Types.ObjectId.isValid(body.brokerName)) {
    const clean = body.brokerName.trim();
    if (clean) {
      let doc = await brokerNameModel.findOne({ brokerName: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await brokerNameModel.create({ brokerName: clean, companyId: cleanCompanyId });
      }
      resolved.brokerName = doc._id;
    }
  }

  // Branch Broker
  if (body.branchBroker && typeof body.branchBroker === "string" && !mongoose.Types.ObjectId.isValid(body.branchBroker)) {
    const clean = body.branchBroker.trim();
    if (clean) {
      let doc = await branchBrokerModel.findOne({ branchBroker: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
      if (!doc) {
        doc = await branchBrokerModel.create({ branchBroker: clean, companyId: cleanCompanyId });
      }
      resolved.branchBroker = doc._id;
    }
  }
  // Payment Mode
  if (body.paymentMode && typeof body.paymentMode === "string") {
    const clean = body.paymentMode.trim().toUpperCase();
    if (clean) {
      try {
        let doc = await PaymentModeModel.findOne({
          paymentMode: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (!doc) {
          doc = await PaymentModeModel.create({ paymentMode: clean });
        }
        resolved.paymentMode = doc.paymentMode;
      } catch (pmErr) {
        console.error("Error creating paymentMode in ensureMastersExist:", pmErr);
        resolved.paymentMode = clean;
      }
    }
  }

  // Brokerage Rates (tpBrokerageRate, odBrokerageRate, rateOnTerr, rateOnOtherTerr)
  const resolveSingleBrokerageRate = async (rateVal) => {
    if (!rateVal) return undefined;
    if (mongoose.Types.ObjectId.isValid(rateVal)) return rateVal;
    let num = NaN;
    if (typeof rateVal === "number") {
      if (rateVal > 0 && rateVal < 1) num = Math.round(rateVal * 100 * 100) / 100;
      else num = rateVal;
    } else {
      const cleanStr = String(rateVal).replace(/%/g, "").trim();
      const parsed = Number(cleanStr);
      if (!isNaN(parsed)) {
        if (parsed > 0 && parsed < 1) num = Math.round(parsed * 100 * 100) / 100;
        else num = parsed;
      }
    }
    if (isNaN(num) || num <= 0) return undefined;
    try {
      let doc = await brokerageRateModel.findOne({ brokerageRate: num });
      if (!doc) {
        doc = await brokerageRateModel.create({ brokerageRate: num, companyId: cleanCompanyId });
      }
      return doc._id;
    } catch (brErr) {
      console.error("Error resolving brokerage rate in ensureMastersExist:", brErr);
      return undefined;
    }
  };

  if (body.tpBrokerageRate) resolved.tpBrokerageRate = await resolveSingleBrokerageRate(body.tpBrokerageRate);
  if (body.odBrokerageRate) resolved.odBrokerageRate = await resolveSingleBrokerageRate(body.odBrokerageRate);
  if (body.rateOnTerr) resolved.rateOnTerr = await resolveSingleBrokerageRate(body.rateOnTerr);
  if (body.rateOnOtherTerr) resolved.rateOnOtherTerr = await resolveSingleBrokerageRate(body.rateOnOtherTerr);

  return resolved;
};

const postPolicyDetail = async (req, res) => {
  try {
    // console.log("📥 Incoming request body:", req.body);

    const {
      financialYear,
      clientType,
      retailCustomer,
      customerGroup,
      subCustomerGroup,
      checkSubGroup,
      branchCode,
      branchName,
      prefix,
      cutomerName,
      mobile,
      email,
      insurerName,
      gstNo,
      showNominee,
      nomineeName,
      nomineeRelation,
      nomineeContact,
      insDepartment,
      product,
      subProduct,
      insCompany,
      brokerName,
      branchBroker,
      tpPolicyDuration,
      tpStartDate,
      tpEndDate,
      tpPremium,
      tpGst,
      tpGstAmount,
      tpAmount,
      odPolicyDuration,
      odStartDate,
      odEndDate,
      odPremium,
      odGst,
      odGstAmount,
      odAmount,
      policyNumber,
      renewalDate,
      sumInsured,
      renewable,
      numberOfInstallments,
      livesCover,
      nextInstallmentDate,
      policyDuration,
      startDate,
      endDate,
      riskCode,
      otherAddon,
      terrirism,
      netPremium,
      CGST,
      SGST,
      IGST,
      UGST,
      gst,
      gstAmount,
      totalAmount,
      siteLocation,
      occupation,
      retroActive,
      incoterms,
      marineClause,
      terrorism,
      permiumOtherThanTerrorism,
      vehicleMake,
      vehicleModel,
      vehicleSubModel,
      vehicleNumber,
      engineNumber,
      monthYearOfRegn,
      fuelType,
      yearOfManufacturing,
      chassisNumber,
      endorsementName,
      endorsementReason,
      endorsementPolicyNumber,
      endorStartDate,
      endorEndDate,
      endorsementTerrorism,
      endorsementOtherTerrorism,
      endorsementNetPremium,
      endorsementGst,
      endorsementGstAmount,
      paymentMode,
      etotalAmount,
      paidAmount,
      chequeNo,
      transactionDate,
      posMisRef,
      bqpCode,
      rateOnOtherTerr,
      amountOnOtherTerr,
      rateOnTerr,
      amountOnTerr,
      odBrokerageRate,
      odBrokerageAmount,
      tpBrokerageRate,
      tpBrokerageAmount,
      totalBrokerageAmount,
      totalBrokerageGst,
      totalBrokerageAmountincGst,
      sharePercentage,
      coBrokerageAmount,
    } = req.body;

    const cleanCompanyId = companyId || req.body.companyId;

    // 🔍 Duplicate Policy Check
    const cleanPolicyNo = policyNumber ? String(policyNumber).trim() : "";
    if (cleanPolicyNo !== "") {
      const dupQuery = {
        policyNumber: { $regex: new RegExp(`^${cleanPolicyNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
      };
      if (cleanCompanyId && mongoose.Types.ObjectId.isValid(cleanCompanyId)) {
        dupQuery.companyId = new mongoose.Types.ObjectId(cleanCompanyId);
      }
      const existingPolicy = await policyDetailModel.findOne(dupQuery);
      if (existingPolicy) {
        return res.status(400).json({
          status: "false",
          success: false,
          error: `Policy with Policy Number '${cleanPolicyNo}' already exists in the database.`
        });
      }
    } else if (cutomerName && insCompany && startDate) {
      const dupQuery = {
        cutomerName: { $regex: new RegExp(`^${String(cutomerName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
        insCompany: mongoose.Types.ObjectId.isValid(insCompany) ? new mongoose.Types.ObjectId(insCompany) : insCompany,
        startDate: new Date(startDate)
      };
      if (cleanCompanyId && mongoose.Types.ObjectId.isValid(cleanCompanyId)) {
        dupQuery.companyId = new mongoose.Types.ObjectId(cleanCompanyId);
      }
      const existingPolicy = await policyDetailModel.findOne(dupQuery);
      if (existingPolicy) {
        return res.status(400).json({
          status: "false",
          success: false,
          error: "A policy with identical Customer Name, Insurance Company, and Start Date already exists."
        });
      }
    }

    const resolved = await ensureCustomerExists(req.body, cleanCompanyId);
    const resolvedMasters = await ensureMastersExist(req.body, cleanCompanyId);

    // 📝 Create new AdminClientRegistration document
    const newPolicyDetail = new policyDetailModel({
      financialYear: req.body.financialYear || undefined,
      clientType: req.body.clientType || undefined,
      retailCustomer: resolved.retailCustomer || undefined,
      customerGroup: resolved.customerGroup || undefined,
      subCustomerGroup: req.body.subCustomerGroup || undefined,
      checkSubGroup: req.body.checkSubGroup || undefined,
      branchCode: resolvedMasters.branchCode || req.body.branchCode || undefined,
      branchName: req.body.branchName || undefined,
      prefix: resolvedMasters.prefix || req.body.prefix || undefined,
      cutomerName,
      mobile,
      email,
      insurerName,
      gstNo,
      showNominee,
      nomineeName,
      nomineeRelation,
      nomineeContact,
      insDepartment: resolvedMasters.insDepartment || req.body.insDepartment || undefined,
      product: resolvedMasters.product || req.body.product || undefined,
      subProduct: req.body.subProduct || undefined,
      insCompany: resolvedMasters.insCompany || req.body.insCompany || undefined,
      brokerName: resolvedMasters.brokerName || req.body.brokerName || undefined,
      branchBroker: resolvedMasters.branchBroker || req.body.branchBroker || undefined,
      tpPolicyDuration,
      tpStartDate,
      tpEndDate,
      tpPremium,
      tpGst,
      tpGstAmount,
      tpAmount,
      odPolicyDuration,
      odStartDate,
      odEndDate,
      odPremium,
      odGst,
      odGstAmount,
      odAmount,
      policyNumber,
      renewalDate,
      sumInsured,
      renewable,
      numberOfInstallments,
      livesCover,
      nextInstallmentDate,
      policyDuration,
      startDate,
      endDate,
      riskCode: req.body.riskCode || undefined,
      otherAddon: req.body.otherAddon || undefined,
      terrirism,
      netPremium,
      CGST,
      SGST,
      IGST,
      UGST,
      gst,
      gstAmount,
      totalAmount,
      siteLocation,
      occupation,
      retroActive,
      incoterms: req.body.incoterms || undefined,
      marineClause: req.body.marineClause || undefined,
      terrorism,
      permiumOtherThanTerrorism,
      vehicleMake,
      vehicleModel,
      vehicleSubModel,
      vehicleNumber,
      engineNumber,
      monthYearOfRegn,
      fuelType: req.body.fuelType || undefined,
      yearOfManufacturing,
      chassisNumber,
      endorsementName,
      endorsementReason: req.body.endorsementReason || undefined,
      endorsementPolicyNumber,
      endorStartDate,
      endorEndDate,
      endorsementTerrorism,
      endorsementOtherTerrorism,
      endorsementNetPremium,
      endorsementGst: req.body.endorsementGst || undefined,
      endorsementGstAmount,
      paymentMode,
      etotalAmount,
      paidAmount,
      chequeNo,
      transactionDate,
      posMisRef,
      bqpCode,
      rateOnOtherTerr: req.body.rateOnOtherTerr || undefined,
      amountOnOtherTerr,
      rateOnTerr: req.body.rateOnTerr || undefined,
      amountOnTerr,
      odBrokerageRate: req.body.odBrokerageRate || undefined,
      odBrokerageAmount,
      tpBrokerageRate: req.body.tpBrokerageRate || undefined,
      tpBrokerageAmount,
      totalBrokerageAmount,
      totalBrokerageGst,
      totalBrokerageAmountincGst,
      sharePercentage: req.body.sharePercentage || undefined,
      coBrokerageAmount: req.body.coBrokerageAmount || undefined,
      companyId,
    });

    await newPolicyDetail.save();

    return res.status(201).json({
      status: true,
      message: "Policy registered successfully",
      data: newPolicyDetail,
    });
  } catch (error) {
    console.error("🔥 Error in postPolicyDetail:", error);
    return res.status(500).json({
      message: "Server error while registering policy.",
      error: error.message,
    });
  }
};

const getPolicyDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await policyDetailModel.findById(id)
      .populate("insDepartment")
      .populate("insCompany")
      .populate("product")
      .populate("subProduct")
      .populate("retailCustomer")
      .populate("customerGroup")
      .populate("subCustomerGroup")
      .populate("branchCode")
      .populate("prefix")
      .populate("brokerName")
      .populate("branchBroker")
      .populate("fuelType")
      .populate("incoterms")
      .populate("otherAddon")
      .populate("endorsementReason")
      .populate("financialYear")
      .populate("gst")
      .populate("tpGst")
      .populate("odGst")
      .populate("endorsementGst")
      .populate("tpBrokerageRate")
      .populate("odBrokerageRate")
      .populate("rateOnTerr")
      .populate("rateOnOtherTerr")
      .populate("riskCode");
    if (!policy) {
      return res
        .status(404)
        .json({ success: false, message: "Policy not found" });
    }

    let policyObj = policy.toObject();
    let modified = false;

    // Self-repair if float serial date ended up in renewable field
    if (policy.renewable && /^\d+(\.\d+)?$/.test(String(policy.renewable).trim()) && !policy.renewalDate) {
      const serialDate = Number(String(policy.renewable).trim());
      const parsedDate = new Date(Math.round((serialDate - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        policy.renewalDate = parsedDate;
        policy.endDate = parsedDate;
        policy.renewable = "RENEWAL";

        policyObj.renewalDate = parsedDate;
        policyObj.endDate = parsedDate;
        policyObj.renewable = "RENEWAL";
        modified = true;
      }
    }

    // Reconstruct start and end dates if they are missing
    if (!policy.endDate && policy.renewalDate) {
      policy.endDate = policy.renewalDate;
      policyObj.endDate = policy.renewalDate;
      modified = true;
    }
    if (!policy.startDate && policy.endDate) {
      const computedStart = new Date(policy.endDate);
      computedStart.setFullYear(computedStart.getFullYear() - 1);
      computedStart.setDate(computedStart.getDate() + 1);
      policy.startDate = computedStart;
      policyObj.startDate = computedStart;
      modified = true;
    }
    if (!policy.tpStartDate && policy.startDate) {
      policy.tpStartDate = policy.startDate;
      policyObj.tpStartDate = policy.startDate;
      modified = true;
    }
    if (!policy.odStartDate && policy.startDate) {
      policy.odStartDate = policy.startDate;
      policyObj.odStartDate = policy.startDate;
      modified = true;
    }
    if (!policy.tpEndDate && (policy.endDate || policy.renewalDate)) {
      policy.tpEndDate = policy.endDate || policy.renewalDate;
      policyObj.tpEndDate = policy.endDate || policy.renewalDate;
      modified = true;
    }
    if (!policy.odEndDate && (policy.endDate || policy.renewalDate)) {
      policy.odEndDate = policy.endDate || policy.renewalDate;
      policyObj.odEndDate = policy.endDate || policy.renewalDate;
      modified = true;
    }

    // Self-repair brokerage totals if missing
    if (!policy.totalBrokerageGst) {
      policy.totalBrokerageGst = 18;
      policyObj.totalBrokerageGst = 18;
      modified = true;
    }
    if ((!policy.totalBrokerageAmount || policy.totalBrokerageAmount === 0) && (policy.odBrokerageAmount || policy.tpBrokerageAmount)) {
      const tot = (policy.odBrokerageAmount || 0) + (policy.tpBrokerageAmount || 0);
      policy.totalBrokerageAmount = tot;
      policyObj.totalBrokerageAmount = tot;
      modified = true;
    }
    if ((!policy.totalBrokerageAmountincGst || policy.totalBrokerageAmountincGst === 0) && policy.totalBrokerageAmount) {
      const totInc = Math.round((policy.totalBrokerageAmount * (1 + ((policy.totalBrokerageGst || 18) / 100))) * 100) / 100;
      policy.totalBrokerageAmountincGst = totInc;
      policyObj.totalBrokerageAmountincGst = totInc;
      modified = true;
    }

    if (modified) {
      await policy.save();
    }

    res.status(200).json({
      success: true,
      data: policyObj,
    });
  } catch (error) {
    console.error("Get policy by ID Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// update policy data
const updatePolicyDetail = async (req, res) => {
  try {
    const policyId = req.params.id;
    let updateData = { ...req.body };

    if (!policyId || !mongoose.Types.ObjectId.isValid(policyId)) {
      return res.status(400).json({ message: "Valid Policy ID is required" });
    }

    const existingPolicy = await policyDetailModel.findById(policyId);
    if (!existingPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    const companyId = existingPolicy.companyId || req.query.companyId;
    
    // Resolve/create customer if necessary
    const resolved = await ensureCustomerExists({
      clientType: updateData.clientType || existingPolicy.clientType,
      cutomerName: updateData.cutomerName !== undefined ? updateData.cutomerName : existingPolicy.cutomerName,
      mobile: updateData.mobile !== undefined ? updateData.mobile : existingPolicy.mobile,
      email: updateData.email !== undefined ? updateData.email : existingPolicy.email,
      gstNo: updateData.gstNo !== undefined ? updateData.gstNo : existingPolicy.gstNo,
      retailCustomer: updateData.retailCustomer || existingPolicy.retailCustomer,
      customerGroup: updateData.customerGroup || existingPolicy.customerGroup,
    }, companyId);

    if (resolved.retailCustomer) {
      updateData.retailCustomer = resolved.retailCustomer;
    }
    if (resolved.customerGroup) {
      updateData.customerGroup = resolved.customerGroup;
    }

    const resolvedMasters = await ensureMastersExist(updateData, companyId);
    Object.assign(updateData, resolvedMasters);

    // 🔍 Duplicate Policy Check on update
    if (updateData.policyNumber && String(updateData.policyNumber).trim() !== "") {
      const cleanPolicyNo = String(updateData.policyNumber).trim();
      const dupQuery = {
        _id: { $ne: policyId },
        policyNumber: { $regex: new RegExp(`^${cleanPolicyNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
      };
      if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
        dupQuery.companyId = new mongoose.Types.ObjectId(companyId);
      }
      const existingDuplicate = await policyDetailModel.findOne(dupQuery);
      if (existingDuplicate) {
        return res.status(400).json({
          status: "false",
          success: false,
          error: `Policy Number '${cleanPolicyNo}' is already used by another policy.`
        });
      }
    }

    // Update only provided fields; $set ensures only changed fields are updated.
    const updatedPolicyDetail = await policyDetailModel.findByIdAndUpdate(
      policyId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedPolicyDetail) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json({
      success: true,
      message: "Policy updated successfully",
      data: updatedPolicyDetail,
    });
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({
      success: false,
      message: "Server Error while updating policy",
      error: error.message,
    });
  }
};

// delete policy Detail
const deletePolicyDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPolicyDetail = await policyDetailModel.findByIdAndDelete(id);

    if (!deletedPolicyDetail) {
      return res.status(404).json({ message: "Policy Details not found" });
    }

    // If customer fetched from policy management, and has no other remaining policies, delete the customer too
    if (deletedPolicyDetail.retailCustomer) {
      const remainingCount = await policyDetailModel.countDocuments({
        retailCustomer: deletedPolicyDetail.retailCustomer
      });
      if (remainingCount === 0) {
        try {
          const customerReg = await CustomerRegistrationModel.findById(deletedPolicyDetail.retailCustomer);
          if (customerReg) {
            await CustomerRegistrationModel.findByIdAndDelete(deletedPolicyDetail.retailCustomer);
            if (customerReg.customerId) {
              await Customer.deleteOne({ customerId: customerReg.customerId });
            }
          }
        } catch (err) {
          console.error("Error cleaning up retail customer on policy delete:", err);
        }
      }
    }

    // Clean up corporate customer group if no other policies exist for it
    if (deletedPolicyDetail.customerGroup) {
      const remainingCount = await policyDetailModel.countDocuments({
        customerGroup: deletedPolicyDetail.customerGroup
      });
      if (remainingCount === 0) {
        try {
          const group = await customerGroupModel.findById(deletedPolicyDetail.customerGroup);
          if (group) {
            await customerGroupModel.findByIdAndDelete(deletedPolicyDetail.customerGroup);
            await Customer.deleteOne({ clientType: "corporate", customerName: group.customerGroupName });
          }
        } catch (err) {
          console.error("Error cleaning up customer group on policy delete:", err);
        }
      }
    }

    return res
      .status(200)
      .json({ status: "true", message: "Policy Details deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error deleting Policy Details" });
  }
};

const importCsv = async (req, res) => {
  try {
    const { companyId, financialYear } = req.query;
    const cleanCompanyId = (companyId && mongoose.Types.ObjectId.isValid(companyId))
      ? companyId
      : "68ca95091d6a9cc2b96ae263";

    if (!req.file?.path)
      return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(req.file.originalname).toLowerCase();

    let rows = [];
    if (ext === ".csv") {
      rows = await csv().fromFile(req.file.path);
    } else if (ext === ".xlsx" || ext === ".xls") {
      const wb = XLSX.readFile(req.file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    const toLowerSafe = (val) => val !== undefined && val !== null ? String(val).toLowerCase().trim() : "";

    const insDepartments = await insDepartmentModel.find({});
    const insCompanies = await insCompanyModel.find({});
    const products = await ProductOrServiceCategorymodel.find({});
    const financialYears = await financialYearModel.find({});
    const existingCustomers = await CustomerRegistrationModel.find({});
    const existingGroups = await customerGroupModel.find({});
    const gstPercentages = await GstPercentageModel.find({});
    const prefixes = await PrefixModel.find({});
    const subProducts = await SubProductCategoryModel.find({});
    const subCustomerGroups = await subCustomerGroupModel.find({});
    const brokerBranches = await brokerBranch.find({});
    const brokerNames = await brokerNameModel.find({});
    const branchBrokers = await branchBrokerModel.find({});
    const fuelTypes = await fuelTypeModel.find({});
    const incotermsList = await incotermsModel.find({});
    const otherAddons = await otherAddonModel.find({});
    const endorsements = await endorsementModel.find({});
    const riskCodes = await riskCodeModel.find({});
    const paymentModes = await PaymentModeModel.find({});
    const brokerageRatesList = await brokerageRateModel.find({});

    const resolveBrokerageRate = async (rawVal) => {
      if (rawVal === undefined || rawVal === null || rawVal === "") return undefined;
      let numRate = NaN;
      if (typeof rawVal === "number") {
        if (rawVal > 0 && rawVal < 1) {
          numRate = Math.round(rawVal * 100 * 100) / 100;
        } else {
          numRate = rawVal;
        }
      } else {
        const cleanStr = String(rawVal).replace(/%/g, "").trim();
        const parsed = Number(cleanStr);
        if (!isNaN(parsed)) {
          if (parsed > 0 && parsed < 1) {
            numRate = Math.round(parsed * 100 * 100) / 100;
          } else {
            numRate = parsed;
          }
        }
      }

      if (isNaN(numRate)) return undefined;

      let found = brokerageRatesList.find(b => Number(b.brokerageRate) === numRate);
      if (!found) {
        try {
          let existing = await brokerageRateModel.findOne({
            brokerageRate: numRate
          });
          if (!existing) {
            existing = new brokerageRateModel({
              brokerageRate: numRate,
              companyId: cleanCompanyId
            });
            await existing.save();
          }
          brokerageRatesList.push(existing);
          found = existing;
        } catch (bErr) {
          console.error("Error creating brokerage rate during import:", bErr);
        }
      }
      return found?._id;
    };

    // 🏢 Dynamic Department Resolver & Cache
    const deptCache = new Map();
    insDepartments.forEach((d) => {
      if (d.insDepartment) {
        deptCache.set(toLowerSafe(d.insDepartment), d._id);
      }
    });

    const resolveDepartment = async (rawDeptStr) => {
      const cleanDept = String(rawDeptStr || "").trim();
      if (!cleanDept) return undefined;
      const lower = toLowerSafe(cleanDept);

      if (deptCache.has(lower)) return deptCache.get(lower);

      for (const [key, id] of deptCache.entries()) {
        if (key.includes(lower) || lower.includes(key)) {
          return id;
        }
      }

      try {
        const newDept = new insDepartmentModel({
          insDepartment: cleanDept,
          companyId: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : cleanCompanyId
        });
        const savedDept = await newDept.save();
        deptCache.set(lower, savedDept._id);
        return savedDept._id;
      } catch (err) {
        console.error("Error creating dynamic department during import:", err);
        return undefined;
      }
    };

    // 🏢 Dynamic Company Resolver & Cache
    const companyCache = new Map();
    insCompanies.forEach((c) => {
      if (c.insCompany) {
        companyCache.set(toLowerSafe(c.insCompany), { _id: c._id, name: c.insCompany });
      }
    });

    const resolveCompany = async (rawCompStr) => {
      const cleanComp = String(rawCompStr || "").trim();
      if (!cleanComp) return { _id: undefined, name: "" };
      const lower = toLowerSafe(cleanComp);

      if (companyCache.has(lower)) return companyCache.get(lower);

      for (const [key, val] of companyCache.entries()) {
        if (key.includes(lower) || lower.includes(key) || key.slice(0, 4) === lower.slice(0, 4)) {
          return val;
        }
      }

      try {
        const newComp = new insCompanyModel({
          insCompany: cleanComp,
          companyId: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : cleanCompanyId
        });
        const savedComp = await newComp.save();

        // Sync with CompanyModel (powers http://localhost:3000/master/company)
        try {
          const cleanNameUpper = cleanComp.trim().toUpperCase();
          const existingAdminComp = await CompanyModel.findOne({ name: { $regex: new RegExp(`^${cleanComp.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
          if (!existingAdminComp) {
            await CompanyModel.create({
              name: cleanNameUpper,
              description: "Imported from Policy Excel",
              status: "active"
            });
          }
        } catch (adminCompErr) {
          console.error("Error syncing company to CompanyModel during import:", adminCompErr);
        }

        const resObj = { _id: savedComp._id, name: savedComp.insCompany };
        companyCache.set(lower, resObj);
        return resObj;
      } catch (err) {
        console.error("Error creating dynamic company during import:", err);
        return { _id: undefined, name: cleanComp };
      }
    };

    // 📦 Dynamic Product Resolver & Cache
    const productCache = new Map();
    products.forEach((p) => {
      if (p.productName) {
        productCache.set(toLowerSafe(p.productName), p._id);
      }
    });

    const resolveProduct = async (rawProdStr, deptId) => {
      const cleanProd = String(rawProdStr || "").trim();
      if (!cleanProd) return undefined;
      const lower = toLowerSafe(cleanProd);

      if (productCache.has(lower)) return productCache.get(lower);

      for (const [key, id] of productCache.entries()) {
        if (key.includes(lower) || lower.includes(key)) {
          return id;
        }
      }

      try {
        const newProd = new ProductOrServiceCategorymodel({
          productName: cleanProd,
          insDepartment: deptId || undefined,
          department: deptId || undefined,
          companyId: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : cleanCompanyId
        });
        const savedProd = await newProd.save();
        productCache.set(lower, savedProd._id);
        return savedProd._id;
      } catch (err) {
        console.error("Error creating dynamic product during import:", err);
        return undefined;
      }
    };

    const prefixCache = new Map();
    prefixes.forEach((p) => {
      if (p.prefix) prefixCache.set(toLowerSafe(p.prefix), p._id);
    });
    const resolvePrefix = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (prefixCache.has(lower)) return prefixCache.get(lower);
      try {
        const doc = new PrefixModel({ prefix: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        prefixCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic prefix during import:", err);
        return undefined;
      }
    };

    // 📦 Dynamic SubProduct Resolver & Cache
    const subProductCache = new Map();
    subProducts.forEach((sp) => {
      if (sp.subProductName) subProductCache.set(toLowerSafe(sp.subProductName), sp._id);
    });
    const resolveSubProduct = async (rawSubStr, productId) => {
      const cleanSub = String(rawSubStr || "").trim();
      if (!cleanSub) return undefined;
      const lower = toLowerSafe(cleanSub);
      if (subProductCache.has(lower)) return subProductCache.get(lower);
      try {
        let parentProdName = "General";
        if (productId) {
          const prodDoc = products.find(p => p._id.toString() === productId.toString());
          if (prodDoc) parentProdName = prodDoc.productName;
        }
        const doc = new SubProductCategoryModel({
          subProductName: cleanSub,
          productName: parentProdName,
          companyId: cleanCompanyId,
          createdBy: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : undefined
        });
        const saved = await doc.save();
        subProductCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic subProduct during import:", err);
        return undefined;
      }
    };

    // 👥 Dynamic SubCustomerGroup Resolver & Cache
    const subGroupCache = new Map();
    subCustomerGroups.forEach((sg) => {
      if (sg.subCustomerGroup) subGroupCache.set(toLowerSafe(sg.subCustomerGroup), sg._id);
    });
    const resolveSubCustomerGroup = async (rawSubGrpStr, customerGroupId) => {
      const cleanSub = String(rawSubGrpStr || "").trim();
      if (!cleanSub || !customerGroupId) return undefined;
      const lower = toLowerSafe(cleanSub);
      if (subGroupCache.has(lower)) return subGroupCache.get(lower);
      try {
        const doc = new subCustomerGroupModel({
          subCustomerGroup: cleanSub,
          customerGroupName: customerGroupId,
          companyId: cleanCompanyId
        });
        const saved = await doc.save();
        subGroupCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic subCustomerGroup during import:", err);
        return undefined;
      }
    };

    // 🏢 Dynamic BrokerBranch Resolver & Cache
    const branchCache = new Map();
    brokerBranches.forEach((b) => {
      if (b.branchCode) branchCache.set(toLowerSafe(b.branchCode), { _id: b._id, branchName: b.branchName || b.branchCode });
      if (b.branchName) branchCache.set(toLowerSafe(b.branchName), { _id: b._id, branchName: b.branchName });
    });
    const resolveBrokerBranch = async (rawBranchStr) => {
      const clean = String(rawBranchStr || "").trim();
      if (!clean) return { _id: undefined, branchName: "" };
      const lower = toLowerSafe(clean);
      if (branchCache.has(lower)) return branchCache.get(lower);
      try {
        const doc = new brokerBranch({
          branchCode: clean,
          branchName: clean,
          companyId: cleanCompanyId
        });
        const saved = await doc.save();
        const resObj = { _id: saved._id, branchName: saved.branchName };
        branchCache.set(lower, resObj);
        return resObj;
      } catch (err) {
        console.error("Error creating dynamic brokerBranch during import:", err);
        return { _id: undefined, branchName: clean };
      }
    };

    // 🤝 Dynamic BrokerName Resolver & Cache
    const brokerNameCache = new Map();
    brokerNames.forEach((bn) => {
      if (bn.brokerName) brokerNameCache.set(toLowerSafe(bn.brokerName), bn._id);
    });
    const resolveBrokerName = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (brokerNameCache.has(lower)) return brokerNameCache.get(lower);
      try {
        const doc = new brokerNameModel({ brokerName: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        brokerNameCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic brokerName during import:", err);
        return undefined;
      }
    };

    // 🏢 Dynamic BranchBroker Resolver & Cache
    const branchBrokerCache = new Map();
    branchBrokers.forEach((bb) => {
      if (bb.branchBroker) branchBrokerCache.set(toLowerSafe(bb.branchBroker), bb._id);
    });
    const resolveBranchBroker = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (branchBrokerCache.has(lower)) return branchBrokerCache.get(lower);
      try {
        const doc = new branchBrokerModel({ branchBroker: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        branchBrokerCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic branchBroker during import:", err);
        return undefined;
      }
    };

    // ⚓ Dynamic FuelType Resolver & Cache
    const fuelTypeCache = new Map();
    fuelTypes.forEach((ft) => {
      if (ft.fuelType) fuelTypeCache.set(toLowerSafe(ft.fuelType), ft._id);
    });
    const resolveFuelType = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (fuelTypeCache.has(lower)) return fuelTypeCache.get(lower);
      try {
        const doc = new fuelTypeModel({ fuelType: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        fuelTypeCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic fuelType during import:", err);
        return undefined;
      }
    };

    // 📜 Dynamic Incoterms Resolver & Cache
    const incotermsCache = new Map();
    incotermsList.forEach((it) => {
      if (it.incoterms) incotermsCache.set(toLowerSafe(it.incoterms), it._id);
    });
    const resolveIncoterms = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (incotermsCache.has(lower)) return incotermsCache.get(lower);
      try {
        const doc = new incotermsModel({ incoterms: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        incotermsCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic incoterms during import:", err);
        return undefined;
      }
    };

    // ➕ Dynamic OtherAddon Resolver & Cache
    const addonCache = new Map();
    otherAddons.forEach((oa) => {
      if (oa.otherAddon) addonCache.set(toLowerSafe(oa.otherAddon), oa._id);
    });
    const resolveOtherAddon = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (addonCache.has(lower)) return addonCache.get(lower);
      try {
        const doc = new otherAddonModel({ otherAddon: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        addonCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic otherAddon during import:", err);
        return undefined;
      }
    };

    // 📝 Dynamic Endorsement Resolver & Cache
    const endorsementCache = new Map();
    endorsements.forEach((e) => {
      if (e.endorsement) endorsementCache.set(toLowerSafe(e.endorsement), e._id);
    });
    const resolveEndorsement = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (endorsementCache.has(lower)) return endorsementCache.get(lower);
      try {
        const doc = new endorsementModel({ endorsement: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        endorsementCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic endorsement during import:", err);
        return undefined;
      }
    };

    // ⚠️ Dynamic RiskCode Resolver & Cache
    const riskCodeCache = new Map();
    riskCodes.forEach((rc) => {
      if (rc.riskCode) riskCodeCache.set(toLowerSafe(rc.riskCode), rc._id);
    });
    const resolveRiskCode = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return undefined;
      const lower = toLowerSafe(clean);
      if (riskCodeCache.has(lower)) return riskCodeCache.get(lower);
      try {
        const doc = new riskCodeModel({ riskCode: clean, companyId: cleanCompanyId });
        const saved = await doc.save();
        riskCodeCache.set(lower, saved._id);
        return saved._id;
      } catch (err) {
        console.error("Error creating dynamic riskCode during import:", err);
        return undefined;
      }
    };

    // 💳 Dynamic PaymentMode Resolver & Cache
    const paymentModeCache = new Map();
    paymentModes.forEach((pm) => {
      if (pm.paymentMode) paymentModeCache.set(toLowerSafe(pm.paymentMode), pm.paymentMode);
    });

    const resolvePaymentMode = async (rawStr) => {
      const clean = String(rawStr || "").trim();
      if (!clean) return "ONLINE";
      const targetMode = clean.toUpperCase();

      const targetLower = toLowerSafe(targetMode);
      if (paymentModeCache.has(targetLower)) return paymentModeCache.get(targetLower);

      try {
        let existingMode = await PaymentModeModel.findOne({
          paymentMode: { $regex: new RegExp(`^${targetMode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (!existingMode) {
          existingMode = await PaymentModeModel.create({ paymentMode: targetMode });
        }
        paymentModeCache.set(targetLower, existingMode.paymentMode);
        return existingMode.paymentMode;
      } catch (err) {
        console.error("Error creating dynamic paymentMode during import:", err);
        paymentModeCache.set(targetLower, targetMode);
        return targetMode;
      }
    };

    const todayDate = new Date();
    const currentFYDoc = financialYears.find(fy => {
      const from = new Date(fy.fromDate);
      const to = new Date(fy.toDate);
      return todayDate >= from && todayDate <= to;
    });
    const currentFYId = currentFYDoc?._id || undefined;

    const findFinancialYearId = (fyStr) => {
      if (!fyStr) return undefined;
      const cleanStr = String(fyStr).replace(/\s+/g, "");
      const match = cleanStr.match(/^(\d{4})/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        if (financialYear && mongoose.Types.ObjectId.isValid(financialYear)) {
          const selectedFYDoc = financialYears.find(fy => fy._id.toString() === financialYear.toString());
          if (selectedFYDoc) {
            const selectedStartYear = new Date(selectedFYDoc.fromDate).getFullYear();
            if (selectedStartYear === startYear) return selectedFYDoc._id;
          }
        }
        const fyDoc = financialYears.find(fy => new Date(fy.fromDate).getFullYear() === startYear);
        if (fyDoc) return fyDoc._id;
      }
      return undefined;
    };

    const excelDateToJSDate = (excelDate) => {
      if (!excelDate) return null;
      if (excelDate instanceof Date) {
        return isNaN(excelDate.getTime()) ? null : excelDate;
      }
      if (typeof excelDate === "number") {
        return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      }
      if (typeof excelDate === "string") {
        const str = excelDate.trim();
        if (!str) return null;
        if (/^\d+(\.\d+)?$/.test(str)) {
          return new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
        }
        const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (dmyMatch) {
          const [, d, m, y] = dmyMatch;
          return new Date(y, m - 1, d);
        }
        const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (ymdMatch) {
          const [, y, m, d] = ymdMatch;
          return new Date(y, m - 1, d);
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed;
        return null;
      }
      return null;
    };

    const getValueByPossibleKeys = (row, ...keys) => {
      const cleanKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      for (const rowKey of Object.keys(row)) {
        const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKeys.includes(cleanRowKey)) return row[rowKey];
      }
      for (const rowKey of Object.keys(row)) {
        const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const cleanK of cleanKeys) {
          if (cleanRowKey.includes(cleanK) || cleanK.includes(cleanRowKey)) return row[rowKey];
        }
      }
      return undefined;
    };

    const customerMap = existingCustomers.reduce((map, cust) => {
      map[toLowerSafe(cust.name)] = cust._id;
      return map;
    }, {});

    const groupMap = existingGroups.reduce((map, gp) => {
      map[toLowerSafe(gp.customerGroupName)] = gp._id;
      return map;
    }, {});

    let processedCount = 0;

    for (const row of rows) {
      const rawPolicyNumber = getValueByPossibleKeys(row, "POLICY NUMBER", "POLICY NO") || "";
      const policyNumber = String(rawPolicyNumber).trim();

      const clientType = toLowerSafe(getValueByPossibleKeys(row, "CUSTOMER TYPE", "CLIENT TYPE")) || "retail";
      const insuredName = String(getValueByPossibleKeys(row, "INSURED NAME", "CUSTOMER NAME", "CLIENT NAME") || "").trim();
      const rawStartDate = getValueByPossibleKeys(row, "POLICY START DATE", "START DATE", "INCEPTION DATE", "RISK INCEPTION DATE", "RISK START DATE", "EFFECTIVE DATE", "FROM DATE", "POLICY FROM DATE", "PERIOD OF INSURANCE FROM", "INSURANCE PERIOD FROM", "PERIOD FROM", "POLICY PERIOD FROM", "COMMENCEMENT DATE", "COVER FROM", "RISK FROM DATE", "RISK FROM", "POLICY START", "FROM", "ISSUE DATE", "BOOKING DATE", "EFFECTIVE FROM", "START_DATE", "FROM_DATE", "RISK_START_DATE", "COMMENCEMENT") || "";

      const mobile = String(getValueByPossibleKeys(row, "MOBILE NO", "MOBILE", "PHONE") || "").trim();
      const email = String(getValueByPossibleKeys(row, "MAIL ID", "EMAIL") || "").trim();
      const gstNo = getValueByPossibleKeys(row, "GST/UDYOG AADHAAR", "GST NO", "GSTIN") || "";

      let retailCustomer = undefined;
      let customerGroup = undefined;

      if (insuredName) {
        const insuredNameKey = toLowerSafe(insuredName);
        if (clientType === "corporate") {
          if (groupMap[insuredNameKey]) {
            customerGroup = groupMap[insuredNameKey];
          } else {
            const newGroup = new customerGroupModel({
              companyId: cleanCompanyId,
              customerGroupName: insuredName,
              email: email,
              mobile: mobile,
              gstNo: gstNo,
            });
            const savedGroup = await newGroup.save();
            customerGroup = savedGroup._id;
            groupMap[insuredNameKey] = savedGroup._id;
            try {
              const legacyCustomer = new Customer({
                clientType: "corporate", customerId: "GRP" + Date.now(), customerName: insuredName, email, mobile, gst: gstNo
              });
              await legacyCustomer.save();
            } catch (err) {}
          }
        } else {
          if (customerMap[insuredNameKey]) {
            retailCustomer = customerMap[insuredNameKey];
          } else {
            const lastCustomer = await CustomerRegistrationModel.findOne().sort({ createdAt: -1 });
            let nextId = "CUST001";
            if (lastCustomer && lastCustomer.customerId) {
              const lastNum = parseInt(lastCustomer.customerId.replace("CUST", ""));
              if (!isNaN(lastNum)) nextId = `CUST${String(lastNum + 1).padStart(3, "0")}`;
            }
            const newCustomer = new CustomerRegistrationModel({
              customerType: "retail", customerId: nextId, name: insuredName, email, mobile, gstNo: gstNo,
              createdBy: mongoose.Types.ObjectId.isValid(cleanCompanyId) ? new mongoose.Types.ObjectId(cleanCompanyId) : undefined,
            });
            const savedCustomer = await newCustomer.save();
            retailCustomer = savedCustomer._id;
            customerMap[insuredNameKey] = savedCustomer._id;
            try {
              const legacyCustomer = new Customer({
                clientType: "retail", customerId: nextId, customerName: insuredName, email, mobile, gst: gstNo
              });
              await legacyCustomer.save();
            } catch (err) {}
          }
        }
      }

      const rawPrefix = getValueByPossibleKeys(row, "PREFIX", "TITLE", "SALUTATION", "CUSTOMER PREFIX", "MR/MRS", "HONORIFIC", "PREFIX NAME");
      const prefixId = await resolvePrefix(rawPrefix);

      const rawBranch = getValueByPossibleKeys(row, "BRANCH CODE", "BRANCH", "BRANCH NAME", "BROKER BRANCH", "LOCATION", "OFFICE", "LOCATION CODE", "DEPT CODE", "BRANCH_CODE");
      const branchObj = await resolveBrokerBranch(rawBranch);
      let branchCodeId = branchObj._id;
      if (!branchCodeId && brokerBranches.length > 0) {
        branchCodeId = brokerBranches[0]._id;
      }
      const branchNameStr = branchObj.branchName || getValueByPossibleKeys(row, "BRANCH NAME", "BRANCH") || "";

      const rawBroker = getValueByPossibleKeys(row, "BROKER NAME", "BROKER", "AGENT NAME", "POS NAME", "AGENT");
      const brokerNameId = (await resolveBrokerName(rawBroker));

      const rawBranchBroker = getValueByPossibleKeys(row, "BRANCH BROKER", "BROKER BRANCH NAME", "BRANCH BROKER NAME");
      const branchBrokerId = (await resolveBranchBroker(rawBranchBroker));

      const rawComp = getValueByPossibleKeys(row, "COMPANY", "INSURANCE COMPANY", "INSURER", "INSURER NAME", "INS COMPANY", "INS_COMPANY", "COMPANY NAME", "INSURANCE CO", "INS CO", "INSURER COMPANY");
      const compObj = await resolveCompany(rawComp);
      const insCompanyId = compObj._id;
      const insurerName = compObj.name || rawComp || "";

      const rawDept = getValueByPossibleKeys(row, "DEPARTMENT", "DEPT", "INSURANCE DEPARTMENT", "DEPT NAME", "DEPARTMENT NAME", "POLICY DEPARTMENT", "POLICY DEPT", "INS_DEPARTMENT", "DEPT_NAME");
      const insDepartmentId = await resolveDepartment(rawDept);

      const rawProd = getValueByPossibleKeys(row, "PRODUCT TYPE", "PRODUCT", "PRODUCT NAME", "PRODUCT_TYPE", "POLICY TYPE", "CATEGORY", "CLASS", "SUB CLASS", "TYPE OF POLICY", "COVERAGE TYPE");
      const productId = await resolveProduct(rawProd, insDepartmentId);

      const rawSubProd = getValueByPossibleKeys(row, "SUB PRODUCT", "SUB PRODUCT CATEGORY", "SUB PRODUCT NAME", "SUB CATEGORY");
      const subProductId = await resolveSubProduct(rawSubProd, productId);

      const rawSubGroup = getValueByPossibleKeys(row, "SUB CUSTOMER GROUP", "SUB GROUP", "SUB GROUP NAME", "SUB CUSTOMER GROUP NAME");
      const subCustomerGroupId = await resolveSubCustomerGroup(rawSubGroup, customerGroup);

      const rawFuel = getValueByPossibleKeys(row, "FUEL TYPE", "FUEL");
      const fuelTypeId = await resolveFuelType(rawFuel);

      const rawInco = getValueByPossibleKeys(row, "INCOTERMS", "INCO TERM", "INCO TERMS");
      const incotermsId = await resolveIncoterms(rawInco);

      const rawAddon = getValueByPossibleKeys(row, "OTHER ADDON", "ADDON", "ADDON NAME", "ADDONS");
      const otherAddonId = await resolveOtherAddon(rawAddon);

      const rawEndorsementReason = getValueByPossibleKeys(row, "ENDORSEMENT REASON", "ENDORSEMENT TYPE", "ENDORSEMENT REASON NAME");
      const endorsementReasonId = await resolveEndorsement(rawEndorsementReason);

      const rawRiskCode = getValueByPossibleKeys(row, "RISK CODE", "RISK");
      const riskCodeId = await resolveRiskCode(rawRiskCode);

      // Financial & Date Parsing
      const odPremium = Number(getValueByPossibleKeys(row, "OD PREMIUM", "OD PREM")) || 0;
      const tpPremium = Number(getValueByPossibleKeys(row, "TP PREMIUM", "TP PREM", "TP PREMIUM ")) || 0;
      let netPremium = Number(getValueByPossibleKeys(row, "NET PREMIUM", "NET PREM", "NET AMOUNT", "BASIC PREMIUM", "PREMIUM", "TAXABLE VALUE", "BASIC PREM", "NET")) || 0;
      if (!netPremium && (odPremium || tpPremium)) {
        netPremium = odPremium + tpPremium;
      }

      let totalAmount = Number(getValueByPossibleKeys(row, "TOTAL PREMIUM ( WITH GST )", "TOTAL PREMIUM", "TOTAL AMOUNT", "GROSS PREMIUM", "FINAL PREMIUM", "TOTAL", "GROSS PREM", "AMOUNT WITH GST", "PREMIUM WITH GST", "TOTAL PREM")) || 0;
      
      let gstAmount = Number(getValueByPossibleKeys(row, "GST AMOUNT", "TOTAL GST", "GST", "IGST AMOUNT", "CGST AMOUNT", "SGST AMOUNT")) || 0;
      if (!gstAmount && totalAmount > 0 && netPremium > 0) {
        gstAmount = Math.max(0, totalAmount - netPremium);
      }
      if (!totalAmount && netPremium > 0) {
        totalAmount = netPremium + gstAmount;
      }
      if (!netPremium && totalAmount > 0) {
        netPremium = Math.max(0, totalAmount - gstAmount);
      }

      const rawGstHeader = getValueByPossibleKeys(row, "GST RATE", "GST %", "GST PERCENTAGE", "TAX RATE", "TAX %", "GST PER");
      let gstRate = rawGstHeader !== undefined ? Number(rawGstHeader) : (netPremium > 0 ? Math.round((gstAmount / netPremium) * 100) : 18);
      if (isNaN(gstRate)) gstRate = 18;

      let gstDoc = gstPercentages.find(g => Math.round(g.value) === Math.round(gstRate));
      if (!gstDoc) {
        let existingGst = await GstPercentageModel.findOne({
          value: gstRate,
          isDeleted: false
        });
        if (!existingGst) {
          existingGst = new GstPercentageModel({
            companyId: cleanCompanyId,
            value: gstRate,
            cgst: gstRate / 2,
            sgst: gstRate / 2,
            igst: gstRate,
            ugst: 0,
            effectiveFrom: new Date("2020-01-01")
          });
          await existingGst.save();
        }
        gstPercentages.push(existingGst);
        gstDoc = existingGst;
      }
      const gstId = gstDoc?._id || undefined;

      const tpGstAmount = netPremium > 0 ? Math.max(0, Math.round((gstAmount * (tpPremium / netPremium)) * 100) / 100) : 0;
      const odGstAmount = netPremium > 0 ? Math.max(0, Math.round((gstAmount * (odPremium / netPremium)) * 100) / 100) : 0;
      const tpAmount = tpPremium + tpGstAmount;
      const odAmount = odPremium + odGstAmount;

      let expiredDate = excelDateToJSDate(getValueByPossibleKeys(row, "EXPIRED DATE", "EXPIRY DATE", "END DATE", "POLICY END DATE", "POLICY EXPIRY DATE", "RISK EXPIRY DATE", "RISK END DATE", "TO DATE", "POLICY TO DATE", "PERIOD OF INSURANCE TO", "INSURANCE PERIOD TO", "PERIOD TO", "POLICY PERIOD TO", "COVER TO", "RISK TO DATE", "RISK TO", "DUE DATE", "RENEWAL DATE", "EXPIRATION DATE", "EXPIRATION", "EFFECTIVE TO", "TO", "END_DATE", "EXPIRY_DATE", "RISK_END_DATE", "RENEWAL/ROLLOVER"));

      let startDate = excelDateToJSDate(rawStartDate);

      if (!startDate && expiredDate) {
        startDate = new Date(expiredDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);
      } else if (startDate && !expiredDate) {
        expiredDate = new Date(startDate);
        expiredDate.setFullYear(expiredDate.getFullYear() + 1);
        expiredDate.setDate(expiredDate.getDate() - 1);
      }

      const tpStartDate = excelDateToJSDate(getValueByPossibleKeys(row, "TP START DATE", "TP INCEPTION DATE", "TP EFFECTIVE DATE", "TP FROM DATE", "TP RISK START DATE", "TP RISK INCEPTION DATE", "TP START", "TP FROM", "TP PERIOD FROM", "TP COVER FROM", "TP COMMENCEMENT DATE", "TP_START_DATE", "TP_FROM_DATE")) || startDate;
      const tpEndDate = excelDateToJSDate(getValueByPossibleKeys(row, "TP END DATE", "TP EXPIRY DATE", "TP RISK EXPIRY DATE", "TP TO DATE", "TP EXPIRY", "TP END", "TP TO", "TP PERIOD TO", "TP COVER TO", "TP EXPIRATION DATE", "TP_END_DATE", "TP_EXPIRY_DATE")) || expiredDate;

      const odStartDate = excelDateToJSDate(getValueByPossibleKeys(row, "OD START DATE", "OD INCEPTION DATE", "OD EFFECTIVE DATE", "OD FROM DATE", "OD RISK START DATE", "OD RISK INCEPTION DATE", "OD START", "OD FROM", "OD PERIOD FROM", "OD COVER FROM", "OD COMMENCEMENT DATE", "OD_START_DATE", "OD_FROM_DATE")) || startDate;
      const odEndDate = excelDateToJSDate(getValueByPossibleKeys(row, "OD END DATE", "OD EXPIRY DATE", "OD RISK EXPIRY DATE", "OD TO DATE", "OD EXPIRY", "OD END", "OD TO", "OD PERIOD TO", "OD COVER TO", "OD EXPIRATION DATE", "OD_END_DATE", "OD_EXPIRY_DATE")) || expiredDate;

      const transactionDate = excelDateToJSDate(getValueByPossibleKeys(row, "TRANSACTION DATE", "PAYMENT DATE")) || (startDate ? new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 2)) : undefined);

      // Nominee details
      const showNomineeVal = getValueByPossibleKeys(row, "SHOW NOMINEE", "NOMINEE SHOW");
      const showNominee = showNomineeVal !== undefined ? (String(showNomineeVal).toLowerCase() === "true" || String(showNomineeVal).toLowerCase() === "yes" || showNomineeVal === 1) : false;
      const nomineeName = String(getValueByPossibleKeys(row, "NOMINEE NAME", "NOMINEE") || "").trim();
      const nomineeRelation = String(getValueByPossibleKeys(row, "NOMINEE RELATION", "RELATION WITH NOMINEE", "RELATION") || "").trim();
      const nomineeContact = String(getValueByPossibleKeys(row, "NOMINEE CONTACT", "NOMINEE MOBILE", "NOMINEE PHONE") || "").trim();

      // Policy Coverage & Duration details
      const sumInsured = Number(getValueByPossibleKeys(row, "SUM INSURED", "SUM ASSURED", "SI")) || undefined;
      const numberOfInstallments = String(getValueByPossibleKeys(row, "NUMBER OF INSTALLMENTS", "NO OF INSTALLMENTS", "INSTALLMENTS") || "").trim();
      const livesCover = String(getValueByPossibleKeys(row, "LIVES COVERED", "LIVES COVER", "NO OF LIVES") || "").trim();
      const nextInstallmentDate = excelDateToJSDate(getValueByPossibleKeys(row, "NEXT INSTALLMENT DATE", "NEXT INSTALLMENT"));
      
      const rawDuration = String(getValueByPossibleKeys(row, "POLICY DURATION", "DURATION", "TERM", "POLICY TERM", "PERIOD", "TENURE") || "").trim().toUpperCase();
      let policyDuration = "YEARLY";
      if (rawDuration.includes("QUARTER")) policyDuration = "QUARTERLY";
      else if (rawDuration.includes("MONTH")) policyDuration = "MONTHLY";
      else if (rawDuration) policyDuration = rawDuration;

      const tpPolicyDuration = String(getValueByPossibleKeys(row, "TP POLICY DURATION", "TP DURATION", "TP TERM", "TP PERIOD") || "YEARLY").trim().toUpperCase() || "YEARLY";
      const odPolicyDuration = String(getValueByPossibleKeys(row, "OD POLICY DURATION", "OD DURATION", "OD TERM", "OD PERIOD") || "YEARLY").trim().toUpperCase() || "YEARLY";

      const terrorism = String(getValueByPossibleKeys(row, "TERRORISM", "TERRORISM COVER", "TERRORISM PREMIUM") || "").trim();
      const permiumOtherThanTerrorism = String(getValueByPossibleKeys(row, "PREMIUM OTHER THAN TERRORISM", "PREMIUM OTHER THAN TERROR") || "").trim();
      const siteLocation = String(getValueByPossibleKeys(row, "SITE LOCATION", "LOCATION") || "").trim();
      const occupation = String(getValueByPossibleKeys(row, "OCCUPATION") || "").trim();
      const retroActive = String(getValueByPossibleKeys(row, "RETRO ACTIVE", "RETROACTIVE DATE", "RETRO ACTIVE DATE") || "").trim();
      const marineClause = String(getValueByPossibleKeys(row, "MARINE CLAUSE") || "").trim();
      const checkSubGroupGroup = String(getValueByPossibleKeys(row, "CHECK SUB GROUP", "CHECK SUB GROUP GROUP") || "").trim();

      // Vehicle details (Make & Model)
      let vehicleMake = String(getValueByPossibleKeys(row, "VEHICLE MAKE", "MAKE", "CAR MAKE") || "").trim();
      let vehicleModel = String(getValueByPossibleKeys(row, "VEHICLE MODEL", "MODEL", "MAKE/MODEL", "MAKE & MODEL", "VEHICLE MAKE & MODEL", "VEHICLE MAKE/MODEL", "CAR MODEL") || "").trim();
      if (!vehicleMake && vehicleModel && (vehicleModel.includes("/") || vehicleModel.includes("-") || vehicleModel.includes("&"))) {
        const parts = vehicleModel.split(/[\/\-&]/);
        if (parts.length >= 2) {
          vehicleMake = parts[0].trim();
          vehicleModel = parts.slice(1).join(" ").trim();
        }
      }
      const vehicleSubModel = String(getValueByPossibleKeys(row, "VEHICLE SUB MODEL", "SUB MODEL") || "").trim();
      const vehicleNumber = String(getValueByPossibleKeys(row, "VEHICLE NO", "VEHICLE NUMBER", "REGISTRATION NO", "REG NO") || "").trim();
      const engineNumber = String(getValueByPossibleKeys(row, "ENGINE NUMBER", "ENGINE NO") || "").trim();
      const monthYearOfRegn = String(getValueByPossibleKeys(row, "MONTH YEAR OF REGISTRATION", "REGISTRATION DATE", "REG DATE", "REGN MONTH YEAR", "REG MONTH YEAR") || "").trim();
      const yearOfManufacturing = String(getValueByPossibleKeys(row, "YEAR OF MANUFACTURING", "MFG YEAR", "MANUFACTURING YEAR") || "").trim();
      const chassisNumber = String(getValueByPossibleKeys(row, "CHASSIS NUMBER", "CHASSIS NO") || "").trim();

      // Endorsement details
      const endorsementName = String(getValueByPossibleKeys(row, "ENDORSEMENT NAME", "ENDORSEMENT") || "").trim();
      const endorsementPolicyNumber = String(getValueByPossibleKeys(row, "ENDORSEMENT POLICY NUMBER", "ENDORSEMENT POLICY NO", "ENDORSEMENT NO") || "").trim();
      const endorStartDate = excelDateToJSDate(getValueByPossibleKeys(row, "ENDORSEMENT START DATE", "ENDOR START DATE"));
      const endorEndDate = excelDateToJSDate(getValueByPossibleKeys(row, "ENDORSEMENT END DATE", "ENDOR END DATE"));
      const endorsementTerrorism = String(getValueByPossibleKeys(row, "ENDORSEMENT TERRORISM") || "").trim();
      const endorsementOtherTerrorism = String(getValueByPossibleKeys(row, "ENDORSEMENT OTHER TERRORISM") || "").trim();
      const endorsementNetPremium = Number(getValueByPossibleKeys(row, "ENDORSEMENT NET PREMIUM")) || undefined;
      const endorsementGstAmount = Number(getValueByPossibleKeys(row, "ENDORSEMENT GST AMOUNT", "ENDORSEMENT GST")) || undefined;

      // Payment & Taxes
      const CGST = String(getValueByPossibleKeys(row, "CGST") || "").trim();
      const SGST = String(getValueByPossibleKeys(row, "SGST") || "").trim();
      const IGST = String(getValueByPossibleKeys(row, "IGST") || "").trim();
      const UGST = String(getValueByPossibleKeys(row, "UGST") || "").trim();
      const etotalAmount = Number(getValueByPossibleKeys(row, "E TOTAL AMOUNT", "E-TOTAL AMOUNT")) || undefined;
      const paidAmountVal = Number(getValueByPossibleKeys(row, "PAID AMOUNT", "AMOUNT PAID"));
      const paidAmount = !isNaN(paidAmountVal) && paidAmountVal > 0 ? paidAmountVal : totalAmount;
      const chequeNo = String(getValueByPossibleKeys(row, "CHEQUE NO", "CHEQUE NUMBER", "TRANSACTION NO", "REF NO") || "").trim();
      const posMisRef = String(getValueByPossibleKeys(row, "POS MIS REF", "POS MIS REFERENCE", "MIS REF") || "").trim();
      const bqpCode = String(getValueByPossibleKeys(row, "BQP CODE", "BQP") || "").trim();

      const rawPayMode = getValueByPossibleKeys(row, "PAYMENT MODE", "PAYMENT TYPE", "MODE OF PAYMENT", "PAYMENT METHOD", "PAY MODE", "PAYMENT");
      const paymentMode = await resolvePaymentMode(rawPayMode);

      // Brokerage & Rate details
      const parseNumericRate = (rawVal) => {
        if (rawVal === undefined || rawVal === null || rawVal === "") return 0;
        const num = Number(String(rawVal).replace(/[^0-9.]/g, ""));
        return isNaN(num) ? 0 : num;
      };

      const rawTpRate = getValueByPossibleKeys(row, "TP BROKERAGE RATE", "TP BROKERAGE %", "TP COMMISSION %", "TP BROKERAGE RATE (%)");
      const tpBrokerageRateId = await resolveBrokerageRate(rawTpRate);
      const tpRateNum = parseNumericRate(rawTpRate);

      const rawOdRate = getValueByPossibleKeys(row, "OD BROKERAGE RATE", "OD BROKERAGE %", "OD COMMISSION %", "BROKERAGE RATE", "BROKERAGE %", "COMMISSION %", "OD BROKERAGE RATE (%)");
      const odBrokerageRateId = await resolveBrokerageRate(rawOdRate);
      const odRateNum = parseNumericRate(rawOdRate);

      const rawTerrRate = getValueByPossibleKeys(row, "RATE ON TERRORISM", "RATE ON TERROR", "TERRORISM RATE", "TERROR RATE", "TERRORISM BROKERAGE RATE", "RATE ON TERRORISM (%)", "RATE ON TERROR (%)", "TERRORISM BROKERAGE RATE (%)", "RATE_ON_TERRORISM", "RATE_ON_TERROR");
      const rateOnTerrId = await resolveBrokerageRate(rawTerrRate);
      const terrRateNum = parseNumericRate(rawTerrRate);

      const rawOtherTerrRate = getValueByPossibleKeys(row, "RATE ON OTHER TERRORISM", "RATE ON OTHER TERROR", "OTHER TERRORISM RATE", "OTHER TERROR RATE", "OTHER TERRORISM BROKERAGE RATE", "RATE ON OTHER TERRORISM (%)", "RATE ON OTHER TERROR (%)", "OTHER TERRORISM BROKERAGE RATE (%)", "RATE_ON_OTHER_TERRORISM", "RATE_ON_OTHER_TERROR");
      const rateOnOtherTerrId = await resolveBrokerageRate(rawOtherTerrRate);
      const otherTerrRateNum = parseNumericRate(rawOtherTerrRate);

      const rawEndorGst = getValueByPossibleKeys(row, "ENDORSEMENT GST", "ENDORSEMENT GST %", "ENDORSEMENT GST RATE");
      const endorGstDoc = rawEndorGst !== undefined ? gstPercentages.find(g => Math.round(g.value) === Math.round(Number(rawEndorGst))) : undefined;
      const endorsementGstId = endorGstDoc?._id || undefined;

      let amountOnTerr = Number(getValueByPossibleKeys(row, "AMOUNT ON TERRORISM", "TERRORISM AMOUNT"));
      if (isNaN(amountOnTerr) || amountOnTerr === 0) {
        const terrPrem = Number(terrorism) || 0;
        if (terrPrem > 0 && terrRateNum > 0) {
          amountOnTerr = Math.round(((terrPrem * terrRateNum) / 100) * 100) / 100;
        } else {
          amountOnTerr = undefined;
        }
      }

      let amountOnOtherTerr = Number(getValueByPossibleKeys(row, "AMOUNT ON OTHER TERRORISM", "OTHER TERRORISM AMOUNT"));
      if (isNaN(amountOnOtherTerr) || amountOnOtherTerr === 0) {
        const otherTerrPrem = Number(permiumOtherThanTerrorism) || (netPremium - (Number(terrorism) || 0));
        if (otherTerrPrem > 0 && otherTerrRateNum > 0) {
          amountOnOtherTerr = Math.round(((otherTerrPrem * otherTerrRateNum) / 100) * 100) / 100;
        } else {
          amountOnOtherTerr = undefined;
        }
      }

      let tpBrokerageAmount = Number(getValueByPossibleKeys(row, "TP BROKERAGE AMOUNT", "TP BROKERAGE", "TP COMMISSION", "TP BROKERAGE (RS)"));
      if (isNaN(tpBrokerageAmount) || tpBrokerageAmount === 0) {
        if (tpPremium > 0 && tpRateNum > 0) {
          tpBrokerageAmount = Math.round(((tpPremium * tpRateNum) / 100) * 100) / 100;
        } else {
          tpBrokerageAmount = undefined;
        }
      }

      let odBrokerageAmount = Number(getValueByPossibleKeys(row, "OD BROKERAGE AMOUNT", "OD BROKERAGE", "OD COMMISSION", "OD BROKERAGE (RS)"));
      if (isNaN(odBrokerageAmount) || odBrokerageAmount === 0) {
        if (odPremium > 0 && odRateNum > 0) {
          odBrokerageAmount = Math.round(((odPremium * odRateNum) / 100) * 100) / 100;
        } else if (netPremium > 0 && odRateNum > 0 && (!tpPremium || tpPremium === 0)) {
          odBrokerageAmount = Math.round(((netPremium * odRateNum) / 100) * 100) / 100;
        } else {
          odBrokerageAmount = undefined;
        }
      }

      let totalBrokerageAmount = Number(getValueByPossibleKeys(row, "TOTAL BROKERAGE AMOUNT", "BROKERAGE AMOUNT", "BROKERAGE", "COMMISSION", "TOTAL BROKERAGE", "COMMISSION AMOUNT", "TOTAL COMMISSION", "BROKERAGE (RS)", "COMMISSION (RS)"));
      if (isNaN(totalBrokerageAmount) || totalBrokerageAmount === 0) {
        if (odBrokerageAmount || tpBrokerageAmount) {
          totalBrokerageAmount = (odBrokerageAmount || 0) + (tpBrokerageAmount || 0);
        } else if (netPremium > 0 && odRateNum > 0) {
          totalBrokerageAmount = Math.round(((netPremium * odRateNum) / 100) * 100) / 100;
        } else {
          totalBrokerageAmount = undefined;
        }
      }

      const rawBrokerageGst = getValueByPossibleKeys(row, "TOTAL BROKERAGE GST", "BROKERAGE GST", "COMMISSION GST", "TOTAL BROKERAGE GST %", "BROKERAGE GST %");
      let totalBrokerageGst = Number(rawBrokerageGst);
      if (isNaN(totalBrokerageGst)) totalBrokerageGst = 18;

      let totalBrokerageAmountincGst = Number(getValueByPossibleKeys(row, "TOTAL BROKERAGE AMOUNT INCL GST", "TOTAL BROKERAGE AMOUNT INC GST", "TOTAL BROKERAGE INC GST", "BROKERAGE INCL GST", "BROKERAGE INC GST", "TOTAL BROKERAGE INCL GST", "TOTAL BROKERAGE AMOUNT WITH GST"));
      if (isNaN(totalBrokerageAmountincGst) || totalBrokerageAmountincGst === 0) {
        if (totalBrokerageAmount && totalBrokerageAmount > 0) {
          const gstAdd = (totalBrokerageAmount * (totalBrokerageGst || 18)) / 100;
          totalBrokerageAmountincGst = Math.round((totalBrokerageAmount + gstAdd) * 100) / 100;
        } else {
          totalBrokerageAmountincGst = undefined;
        }
      }

      const sharePercentage = Number(getValueByPossibleKeys(row, "SHARE PERCENTAGE", "SHARE %", "CO BROKERAGE SHARE %", "CO BROKERAGE %")) || undefined;
      const coBrokerageAmount = Number(getValueByPossibleKeys(row, "CO BROKERAGE AMOUNT", "CO BROKERAGE", "CO-BROKERAGE AMOUNT", "CO-BROKERAGE")) || undefined;

      const policyPayload = {
        financialYear: findFinancialYearId(getValueByPossibleKeys(row, "Financial Year", "FY")) || (financialYear && mongoose.Types.ObjectId.isValid(financialYear) ? new mongoose.Types.ObjectId(financialYear) : currentFYId),
        companyId: cleanCompanyId,
        prefix: prefixId,
        branchCode: branchCodeId,
        branchName: branchNameStr,
        brokerName: brokerNameId,
        branchBroker: branchBrokerId,
        cutomerName: insuredName,
        clientType,
        retailCustomer,
        customerGroup,
        subCustomerGroup: subCustomerGroupId,
        checkSubGroup: checkSubGroupGroup,
        mobile,
        email,
        showNominee,
        nomineeName,
        nomineeRelation,
        nomineeContact,
        renewable: getValueByPossibleKeys(row, "RENEWAL/ROLLOVER", "RENEWAL") || "RENEWAL",
        policyNumber: policyNumber || undefined,
        odPremium,
        tpPremium,
        tpGst: gstId,
        tpGstAmount,
        tpAmount,

        odPolicyDuration: getValueByPossibleKeys(row, "OD Policy Duration") || (odPremium > 0 ? "YEARLY" : undefined),
        odStartDate: excelDateToJSDate(getValueByPossibleKeys(row, "OD Start Date")) || (odPremium > 0 ? startDate : undefined),
        odEndDate: excelDateToJSDate(getValueByPossibleKeys(row, "OD End Date")) || (odPremium > 0 ? expiredDate : undefined),
        odPremium,
        odGst: gstId,
        odGstAmount,
        odAmount,

        policyNumber,
        renewalDate: excelDateToJSDate(getValueByPossibleKeys(row, "Renewal Date", "RENEWAL/ROLLOVER")) || expiredDate,
        sumInsured: sumInsured || Number(getValueByPossibleKeys(row, "SUM INSURED", "SUM INSURED (RS)", "SUM_INSURED", "SI")) || undefined,
        renewable: getValueByPossibleKeys(row, "Renewable", "RENEWAL/ROLLOVER", "RENEWAL") || "RENEWAL",
        numberOfInstallments: getValueByPossibleKeys(row, "Number Of Installments"),
        livesCover: getValueByPossibleKeys(row, "Lives Covered"),
        nextInstallmentDate: excelDateToJSDate(getValueByPossibleKeys(row, "Next Installment Date")),
        policyDuration: getValueByPossibleKeys(row, "Policy Duration") || "YEARLY",
        startDate,
        endDate: expiredDate,
        riskCode: riskCodeId || getValueByPossibleKeys(row, "Risk Code"),
        otherAddon: otherAddonId,
        terrirism: getValueByPossibleKeys(row, "Terrorism"),
        netPremium,
        CGST: getValueByPossibleKeys(row, "CGST"),
        SGST: getValueByPossibleKeys(row, "SGST"),
        IGST: getValueByPossibleKeys(row, "IGST"),
        UGST: getValueByPossibleKeys(row, "UGST"),
        gst: gstId,
        gstAmount,
        totalAmount,
        renewalDate: expiredDate,
        insDepartment: insDepartmentId,
        product: productId,
        subProduct: subProductId,
        insCompany: insCompanyId,
        insurerName,
        tpEndDate: tpEndDate || expiredDate || undefined,
        odEndDate: odEndDate || expiredDate || undefined,
        endDate: expiredDate || undefined,
        startDate: startDate || undefined,
        tpStartDate: tpStartDate || startDate || undefined,
        odStartDate: odStartDate || startDate || undefined,
        transactionDate,
        gst: gstId,
        tpGst: tpPremium > 0 ? gstId : undefined,
        odGst: odPremium > 0 ? gstId : undefined,
        tpGstAmount,
        odGstAmount,
        tpAmount,
        odAmount,
        sumInsured,
        numberOfInstallments,
        livesCover,
        nextInstallmentDate,
        policyDuration,
        tpPolicyDuration,
        odPolicyDuration,
        riskCode: riskCodeId,
        otherAddon: otherAddonId,
        terrorism,
        permiumOtherThanTerrorism,
        siteLocation,
        occupation,
        retroActive,
        incoterms: incotermsId,
        marineClause,
        vehicleMake,
        vehicleModel,
        vehicleSubModel,
        vehicleNumber,
        engineNumber,
        monthYearOfRegn,
        fuelType: fuelTypeId,
        yearOfManufacturing,
        chassisNumber,
        endorsementName,
        endorsementReason: endorsementReasonId,
        endorsementPolicyNumber,
        endorStartDate,
        endorEndDate,
        endorsementTerrorism,
        endorsementOtherTerrorism,
        endorsementNetPremium,
        endorsementGstAmount,
        paymentMode,
        paidAmount,
        etotalAmount,
        chequeNo,
        posMisRef,
        bqpCode,
        CGST,
        SGST,
        IGST,
        UGST,
        tpBrokerageRate: tpBrokerageRateId,
        odBrokerageRate: odBrokerageRateId,
        rateOnTerr: rateOnTerrId,
        rateOnOtherTerr: rateOnOtherTerrId,
        endorsementGst: endorsementGstId,
        sharePercentage,
        coBrokerageAmount,
        amountOnOtherTerr,
        amountOnTerr,
        odBrokerageAmount,
        tpBrokerageAmount,
        totalBrokerageAmount,
        totalBrokerageGst,
        totalBrokerageAmountincGst,
        gstNo,
      };

      // Non-blocking upsert / save logic
      if (policyNumber) {
        const filter = {
          policyNumber: { $regex: new RegExp(`^${policyNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        if (cleanCompanyId && mongoose.Types.ObjectId.isValid(cleanCompanyId)) {
          filter.companyId = cleanCompanyId;
        }
        await policyDetailModel.findOneAndUpdate(filter, policyPayload, { upsert: true, new: true, setDefaultsOnInsert: true });
      } else {
        await policyDetailModel.create(policyPayload);
      }
      processedCount++;
    }

    return res.status(200).json({
      success: true,
      insertedCount: processedCount,
      skippedCount: 0,
      failedCount: 0,
      message: `Successfully processed and imported ${processedCount} records without errors.`,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: e.message });
  }
};
const exportCsv = async (req, res) => {
  const { companyId } = req.query;

  try {
    const query = {};
    if (companyId && mongoose.Types.ObjectId.isValid(companyId) && companyId !== "68c07ddaeb160d097128c5af") {
      query.$or = [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: null },
        { companyId: { $exists: false } }
      ];
    }

    const policyData = await policyDetailModel
      .find(query)
      .populate("insDepartment", "insDepartment")
      .populate("insCompany", "insCompany name")
      .populate("financialYear")
      .populate("prefix")
      .populate("gst")
      .populate("tpGst")
      .populate("odGst")
      .populate("rateOnTerr")
      .populate("rateOnOtherTerr")
      .populate("tpBrokerageRate")
      .populate("odBrokerageRate")
      .populate("product")
      .populate("subProduct")
      .populate("retailCustomer")
      .populate("customerGroup")
      .populate("subCustomerGroup")
      .populate("branchCode")
      .populate("branchBroker")
      .populate("brokerName")
      .populate("endorsementGst");

    const exportData = policyData.map((p) => {
      const obj = p.toObject();

      return {
        ...obj,
        insDepartment: obj.insDepartment?.insDepartment || "",
        insCompany: obj.insCompany?.insCompany || obj.insCompany?.name || "",
        brokerName: obj.brokerName?.brokerName || "",
        branchBroker: obj.branchBroker?.branchBroker || "",
        branchCode: obj.branchCode?.branchCode || "",
        prefix: obj.prefix?.prefix || "",
        product: obj.product?.productName || "",
        subProduct: obj.subProduct?.subProductName || "",
        retailCustomer: obj.retailCustomer?.name || obj.retailCustomer?.cutomerName || "",
        customerGroup: obj.customerGroup?.groupName || obj.customerGroup?.name || "",
        subCustomerGroup: obj.subCustomerGroup?.subCustomerGroup || obj.subCustomerGroup?.name || "",
        gst: obj.gst?.value || "",
        tpGst: obj.tpGst?.value || "",
        odGst: obj.odGst?.value || "",
        rateOnTerr: obj.rateOnTerr?.brokerageRate || "",
        rateOnOtherTerr: obj.rateOnOtherTerr?.brokerageRate || "",
        tpBrokerageRate: obj.tpBrokerageRate?.brokerageRate || "",
        odBrokerageRate: obj.odBrokerageRate?.brokerageRate || "",
        financialYear: obj.financialYear?.fromDate && obj.financialYear?.toDate
          ? `${new Date(obj.financialYear.fromDate).getFullYear()}-${new Date(obj.financialYear.toDate).getFullYear()}`
          : "",
      };
    });

    // console.log("Policy export ", exportData);

    const csvFields = [
      { label: "Financial Year", value: "financialYear" },
      { label: "Client Type", value: "clientType" },
      { label: "Retail Customer", value: "retailCustomer" },
      { label: "Customer Group", value: "customerGroup" },
      { label: "Sub Customer Group", value: "subCustomerGroup" },
      { label: "Check Sub Group", value: "checkSubGroup" },
      { label: "Branch Code", value: "branchCode" },
      { label: "Branch Name", value: "branchName" },
      { label: "Prefix", value: "prefix" },
      { label: "Customer Name", value: "cutomerName" },
      { label: "Mobile", value: "mobile" },
      { label: "Email", value: "email" },
      { label: "Insurer Name", value: "insurerName" },
      { label: "GST No", value: "gstNo" },
      { label: "Show Nominee", value: "showNominee" },
      { label: "Nominee Name", value: "nomineeName" },
      { label: "Nominee Relation", value: "nomineeRelation" },
      { label: "Nominee Contact", value: "nomineeContact" },
      { label: "Insurance Department", value: "insDepartment" },
      { label: "Product", value: "product" },
      { label: "Sub Product", value: "subProduct" },
      { label: "Insurance Company", value: "insCompany" },
      { label: "Broker Name", value: "brokerName" },
      { label: "Branch Broker", value: "branchBroker" },

      { label: "TP Policy Duration", value: "tpPolicyDuration" },
      { label: "TP Start Date", value: "tpStartDate" },
      { label: "TP End Date", value: "tpEndDate" },
      { label: "TP Premium", value: "tpPremium" },
      { label: "TP GST", value: "tpGst" },
      { label: "TP GST Amount", value: "tpGstAmount" },
      { label: "TP Amount", value: "tpAmount" },

      { label: "OD Policy Duration", value: "odPolicyDuration" },
      { label: "OD Start Date", value: "odStartDate" },
      { label: "OD End Date", value: "odEndDate" },
      { label: "OD Premium", value: "odPremium" },
      { label: "OD GST", value: "odGst" },
      { label: "OD GST Amount", value: "odGstAmount" },
      { label: "OD Amount", value: "odAmount" },

      { label: "Policy Number", value: "policyNumber" },
      { label: "Renewal Date", value: "renewalDate" },
      { label: "Sum Insured", value: "sumInsured" },
      { label: "Renewable", value: "renewable" },
      { label: "Number Of Installments", value: "numberOfInstallments" },
      { label: "Lives Covered", value: "livesCover" },
      { label: "Next Installment Date", value: "nextInstallmentDate" },
      { label: "Policy Duration", value: "policyDuration" },
      { label: "Start Date", value: "startDate" },
      { label: "End Date", value: "endDate" },

      { label: "Risk Code", value: "riskCode" },
      { label: "Other Addon", value: "otherAddon" },
      { label: "Terrorism", value: "terrorism" },
      { label: "Net Premium", value: "netPremium" },

      { label: "CGST", value: "CGST" },
      { label: "SGST", value: "SGST" },
      { label: "IGST", value: "IGST" },
      { label: "UGST", value: "UGST" },
      { label: "GST", value: "gst" },
      { label: "GST Amount", value: "gstAmount" },
      { label: "Total Amount", value: "totalAmount" },

      { label: "Site Location", value: "siteLocation" },
      { label: "Occupation", value: "occupation" },
      { label: "Retro Active", value: "retroActive" },
      { label: "Incoterms", value: "incoterms" },
      { label: "Marine Clause", value: "marineClause" },
      { label: "Terrorism Cover", value: "terrorism" },
      {
        label: "Premium Other Than Terrorism",
        value: "permiumOtherThanTerrorism",
      },

      { label: "Vehicle Make", value: "vehicleMake" },
      { label: "Vehicle Model", value: "vehicleModel" },
      { label: "Vehicle Sub Model", value: "vehicleSubModel" },
      { label: "Vehicle Number", value: "vehicleNumber" },
      { label: "Engine Number", value: "engineNumber" },
      { label: "Month Year Of Registration", value: "monthYearOfRegn" },
      { label: "Fuel Type", value: "fuelType" },
      { label: "Year Of Manufacturing", value: "yearOfManufacturing" },
      { label: "Chassis Number", value: "chassisNumber" },

      { label: "Endorsement Name", value: "endorsementName" },
      { label: "Endorsement Reason", value: "endorsementReason" },
      { label: "Endorsement Policy Number", value: "endorsementPolicyNumber" },
      { label: "Endorsement Start Date", value: "endorStartDate" },
      { label: "Endorsement End Date", value: "endorEndDate" },
      { label: "Endorsement Terrorism", value: "endorsementTerrorism" },
      {
        label: "Endorsement Other Terrorism",
        value: "endorsementOtherTerrorism",
      },
      { label: "Endorsement Net Premium", value: "endorsementNetPremium" },

      { label: "Payment Mode", value: "paymentMode" },
      { label: "E Total Amount", value: "etotalAmount" },
      { label: "Paid Amount", value: "paidAmount" },
      { label: "Cheque No", value: "chequeNo" },
      { label: "Transaction Date", value: "transactionDate" },
      { label: "POS MIS Ref", value: "posMisRef" },
      { label: "BQP Code", value: "bqpCode" },

      { label: "Rate On Other Terrorism", value: "rateOnOtherTerr" },
      { label: "Amount On Other Terrorism", value: "amountOnOtherTerr" },
      { label: "Rate On Terrorism", value: "rateOnTerr" },
      { label: "Amount On Terrorism", value: "amountOnTerr" },

      { label: "OD Brokerage Rate", value: "odBrokerageRate" },
      { label: "OD Brokerage Amount", value: "odBrokerageAmount" },
      { label: "TP Brokerage Rate", value: "tpBrokerageRate" },
      { label: "TP Brokerage Amount", value: "tpBrokerageAmount" },
      { label: "Total Brokerage Amount", value: "totalBrokerageAmount" },
      { label: "Total Brokerage GST", value: "totalBrokerageGst" },
      {
        label: "Total Brokerage Amount Incl GST",
        value: "totalBrokerageAmountincGst",
      },
    ];

    // Deduplicate export records
    const seenIds = new Set();
    const seenPolicyNumbers = new Set();
    const uniqueExportData = [];

    for (const row of exportData) {
      const idStr = String(row._id);
      if (seenIds.has(idStr)) continue;
      seenIds.add(idStr);

      const polNo = row.policyNumber ? String(row.policyNumber).trim().toLowerCase() : "";
      if (polNo !== "") {
        if (seenPolicyNumbers.has(polNo)) continue;
        seenPolicyNumbers.add(polNo);
      }

      uniqueExportData.push(row);
    }

    const excelData = uniqueExportData.map((row) => {
      const mappedRow = {};
      csvFields.forEach((field) => {
        mappedRow[field.label] = row[field.value] !== undefined ? row[field.value] : "";
      });
      return mappedRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Policies");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=policies.xlsx");
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).send("An error occurred while exporting the data.");
  }
};

const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateId, variables, mobile } = req.body;

    const policy = await policyDetailModel.findById(id)
      .populate("retailCustomer")
      .populate("customerGroup");

    if (!policy) {
      return res.status(404).json({ success: false, message: "Policy not found" });
    }

    // Increment count
    policy.messageCount = (policy.messageCount || 0) + 1;
    await policy.save();

    // Prepare customer name
    let customerName = policy.cutomerName || "";
    if (!customerName && policy.retailCustomer) {
      customerName = policy.retailCustomer.name;
    }
    if (!customerName && policy.customerGroup) {
      customerName = policy.customerGroup.groupName || policy.customerGroup.name;
    }
    if (!customerName) {
      customerName = "Valued Customer";
    }

    const DLT_TEMPLATES = {
      "1707171229475133470": {
        text: "Dear Sir / Madam\nYour Vehicle Policy No {var1} for vehicle No {var2} is due for Renewal on {var3}\nKindly renew the policy before expiry for continuous coverage\nPlease don't hesitate to contact us\n7507553335, 7757825335\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171229478113200": {
        text: "Dear Sir / Madam\nYour Vehicle Policy No {var1} for vehicle No {var2} is due for Renewal on {var3} which has not yet been renewed as per our records.\nPlease renew it immediately\nContact us\n7507553335, 7757825335\nIf policy renewed, please ignore the message.\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171229481145664": {
        text: "Dear Sir / Madam\nYour {var1} Policy No {var2} is due for Renewal on {var3}\nKindly renew the policy before expiry for continuous coverage\nPlease don't hesitate to contact us\n7507553335, 7757825335\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171229847086671": {
        text: "Dear Sir / Madam\nYour {var1} is due for Renewal on {var2} which has not yet been renewed as per our records. Please renew it immediately\nContact us\n7507553335, 7757825335 \nIf policy renewed, please ignore the message.\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171705453558611": {
        text: "Dear Sir / Madam\nYour {var1} Policy No {var2} is due for Renewal on {var3} which has not yet been renewed as per our records. Please renew it immediately\nContact us\n7507553335, 7757825335 \nIf policy renewed, please ignore the message.\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171154526920734": {
        text: "Dear Sir / Madam\nYour Private Car Policy No {var1} for vehicle No {var2} is due for Renewal on {var3}\nKindly renew the policy before expiry for continuous coverage\nPlease don't hesitate to contact us\n7507553335, 7757825335\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171154531182881": {
        text: "Dear Sir / Madam\nYour Mediclaim Policy No {var1} is due for Renewal on {var2}\nKindly renew the policy before expiry for continuous coverage\nPlease don't hesitate to contact us\n7507553335, 7757825335\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171154535303724": {
        text: "Reminder\nDear Sir / Madam\nYour Private Car Policy No {var1} for vehicle No {var2} is due for Renewal on {var3} which has not yet been renewed as per our records.\nPlease renew it immediately\nContact us\n7507553335, 7757825335\nIf policy renewed, please ignore the message.\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      },
      "1707171154539354305": {
        text: "Reminder\nDear Sir / Madam\nYour Mediclaim Policy No {var1} due for Renewal on {var2} which has not yet been renewed as per our records.\nPlease renew it immediately\nContact us\n7507553335, 7757825335\nIf policy renewed, please ignore the message.\nRegards\nNitin Jeswani\nJP Insurance Brokers"
      }
    };

    let compiledMessage = "";
    const targetMobile = mobile || policy.mobile || "";

    if (templateId && DLT_TEMPLATES[templateId]) {
      let templateText = DLT_TEMPLATES[templateId].text;
      if (Array.isArray(variables)) {
        variables.forEach((val, idx) => {
          templateText = templateText.replace(new RegExp(`\\{var${idx + 1}\\}`, 'g'), val || "");
        });
      }
      compiledMessage = templateText;
    } else {
      // Fallback message
      const policyNumber = policy.policyNumber || "N/A";
      const expiryDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString('en-GB') : "N/A";
      compiledMessage = `Dear Sir / Madam\nYour Policy No ${policyNumber} is due for Renewal on ${expiryDate}.\nKindly renew the policy before expiry for continuous coverage.\nRegards\nJP Insurance Brokers`;
    }

    console.log(`[SMS/Text Message Triggered] To: ${targetMobile}, Template: ${templateId || "Fallback"}, Message: ${compiledMessage}`);

    let apiSuccess = false;
    let apiResponse = null;

    if (targetMobile) {
      try {
        const apikey = "6605155b543da";
        const route = "transactional";
        const sender = "JPINBR";
        const dltentityid = "1501333130000043941";
        
        // Build API URL
        const apiUrl = `http://commnestsms.com/api/push.json?apikey=${apikey}&route=${route}&sender=${sender}&mobileno=${targetMobile}&text=${encodeURIComponent(compiledMessage)}&dltentityid=${dltentityid}${templateId ? `&dlttemplateid=${templateId}` : ''}`;
        
        const response = await axios.get(apiUrl);
        apiResponse = response.data;
        apiSuccess = true;
        console.log(`[SMS/Text Message API Success] Response:`, apiResponse);
      } catch (apiError) {
        console.error("Error calling CommNest API:", apiError.message);
        apiResponse = { error: apiError.message };
      }
    }

    // Create or update RenewalReminder entry
    const policyNumber = policy.policyNumber || "N/A";
    let existingReminder = await RenewalReminder.findOne({ policyId: id });
    if (existingReminder) {
      existingReminder.customerName = customerName;
      existingReminder.contactNo = targetMobile;
      existingReminder.email = policy.email || "";
      existingReminder.reminderDate = new Date();
      existingReminder.status = "active";
      await existingReminder.save();
    } else {
      await RenewalReminder.create({
        policyId: id,
        customerName: customerName,
        contactNo: targetMobile,
        email: policy.email || "",
        policyNo: policyNumber,
        endDate: policy.endDate || new Date(),
        reminderDate: new Date(),
        reminderDays: 7,
        status: "active"
      });
    }

    return res.status(200).json({
      success: true,
      message: apiSuccess ? "Reminder message sent successfully" : "Reminder compiled but gateway call failed",
      messageCount: policy.messageCount,
      dummyMessage: compiledMessage,
      apiResponse
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  getPolicyDetail,
  postPolicyDetail,
  getPolicyDetailById,
  updatePolicyDetail,
  deletePolicyDetail,
  getPolicyCount,
  getPolicyDetailByFY,
  importCsv,
  exportCsv,
  sendReminder,
};
