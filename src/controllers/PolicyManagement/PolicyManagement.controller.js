const mongoose = require("mongoose");
const { policyDetailModel, insDepartmentModel, insCompanyModel, financialYearModel, CustomerRegistrationModel, customerGroupModel, GstPercentageModel } = require("../../models/index");
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
    // const { companyId } = req.query;
    // companyId: new mongoose.Types.ObjectId(companyId),

    const count = await policyDetailModel.countDocuments({});

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
    const { financialYear } = req.query;

    const policyDetail = await policyDetailModel
      .find({
        financialYear: new mongoose.Types.ObjectId(financialYear),
      })
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
    const { financialYear, policyNumber } = req.query;
    // const { companyId } = req.query;

    const query = {};
    if (policyNumber) {
      query.policyNumber = policyNumber;
    } else {
      const clearFY = financialYear?.toString().substring(0, 24);
      if (
        clearFY &&
        clearFY.length === 24 &&
        mongoose.Types.ObjectId.isValid(clearFY)
      ) {
        query.$or = [
          { financialYear: new mongoose.Types.ObjectId(clearFY) },
          { financialYear: null },
          { financialYear: { $exists: false } }
        ];
      }
    }

    const policyDetail = await policyDetailModel
      .find(query)
      .populate("insDepartment")
      .populate("insCompany")
      .populate("retailCustomer")
      .populate("customerGroup")
      .sort({ createdAt: -1 });
    // .populate("ProductOrServiceCategory");
    // .populate("financialYear");

    // console.log("------------------------------------------", policyDetail);

    if (!policyDetail || policyDetail.length === 0) {
      return res.status(200).json({ status: "true", data: [] });
    }

    // // sort data from newest to oldest
    // policyDetail.sort(
    //   (a, b) => new Date(b.createdAt) - new Date(a.createdAt), // b is newer, a is older
    // );

    return res.status(200).json({ status: "true", data: policyDetail });
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
        companyId: companyId || "68ca95091d6a9cc2b96ae263",
        customerGroupName: cutomerName,
        email: email,
        mobile: mobile,
        gstNo: gstNo,
        createdBy: companyId ? new mongoose.Types.ObjectId(companyId) : undefined
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

const postPolicyDetail = async (req, res) => {
  try {
    console.log("📥 Incoming request body:", req.body);

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

    const { companyId } = req.query;

    const resolved = await ensureCustomerExists(req.body, companyId);

    // 📝 Create new AdminClientRegistration document
    const newPolicyDetail = new policyDetailModel({
      financialYear: req.body.financialYear || undefined,
      clientType: req.body.clientType || undefined,
      retailCustomer: resolved.retailCustomer || undefined,
      customerGroup: resolved.customerGroup || undefined,
      subCustomerGroup: req.body.subCustomerGroup || undefined,
      checkSubGroup: req.body.checkSubGroup || undefined,
      branchCode: req.body.branchCode || undefined,
      branchName: req.body.branchName || undefined,
      prefix: req.body.prefix || undefined,
      cutomerName,
      mobile,
      email,
      insurerName,
      gstNo,
      showNominee,
      nomineeName,
      nomineeRelation,
      nomineeContact,
      insDepartment: req.body.insDepartment || undefined,
      product: req.body.product || undefined,
      subProduct: req.body.subProduct || undefined,
      insCompany: req.body.insCompany || undefined,
      brokerName: req.body.brokerName || undefined,
      branchBroker: req.body.branchBroker || undefined,
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
    const policy = await policyDetailModel.findById(id);
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
    if (policy.tpPremium && !policy.tpStartDate && policy.startDate) {
      policy.tpStartDate = policy.startDate;
      policyObj.tpStartDate = policy.startDate;
      modified = true;
    }
    if (policy.odPremium && !policy.odStartDate && policy.startDate) {
      policy.odStartDate = policy.startDate;
      policyObj.odStartDate = policy.startDate;
      modified = true;
    }
    if (policy.tpPremium && !policy.tpEndDate && policy.endDate) {
      policy.tpEndDate = policy.endDate;
      policyObj.tpEndDate = policy.endDate;
      modified = true;
    }
    if (policy.odPremium && !policy.odEndDate && policy.endDate) {
      policy.odEndDate = policy.endDate;
      policyObj.odEndDate = policy.endDate;
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

    const toLowerSafe = (val) =>
      val !== undefined && val !== null ? String(val).toLowerCase().trim() : "";

    const insDepartments = await insDepartmentModel.find(
      {},
      { _id: 1, insDepartment: 1 },
    );

    const departmentMap = insDepartments.reduce((map, dept) => {
      map[toLowerSafe(dept.insDepartment)] = dept._id;
      return map;
    }, {});

    const insCompany = await insCompanyModel.find(
      {},
      { _id: 1, insCompany: 1 },
    );

    const companyList = insCompany.map((c) => ({
      key: toLowerSafe(c.insCompany).slice(0, 4),
      _id: c._id,
      name: c.insCompany,
    }));

    const products = await ProductOrServiceCategorymodel.find({});
    const financialYears = await financialYearModel.find({});

    const findFinancialYearId = (fyStr) => {
      if (!fyStr) return undefined;
      const cleanStr = String(fyStr).replace(/\s+/g, "");
      const match = cleanStr.match(/^(\d{4})/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        const fyDoc = financialYears.find(fy => {
          const fyStart = new Date(fy.fromDate).getFullYear();
          return fyStart === startYear;
        });
        if (fyDoc) return fyDoc._id;
      }
      return undefined;
    };

    const excelDateToJSDate = (excelDate) => {
      if (!excelDate) return null;
      if (typeof excelDate === "string") {
        if (/^\d+(\.\d+)?$/.test(excelDate.trim())) {
          return new Date(Math.round((Number(excelDate) - 25569) * 86400 * 1000));
        }
        const parsed = new Date(excelDate);
        if (!isNaN(parsed.getTime())) return parsed;
        const parts = excelDate.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
          } else if (parts[0].length === 4) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
          }
        }
        return null;
      }
      return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    };

    const getValueByPossibleKeys = (row, ...keys) => {
      const cleanKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      for (const rowKey of Object.keys(row)) {
        const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKeys.includes(cleanRowKey)) {
          return row[rowKey];
        }
      }
      for (const rowKey of Object.keys(row)) {
        const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const cleanK of cleanKeys) {
          if (cleanRowKey.includes(cleanK) || cleanK.includes(cleanRowKey)) {
            return row[rowKey];
          }
        }
      }
      return undefined;
    };

    const policyDetailsArray = [];

    const existingCustomers = await CustomerRegistrationModel.find({});
    const existingGroups = await customerGroupModel.find({});
    const gstPercentages = await GstPercentageModel.find({});

    const customerMap = existingCustomers.reduce((map, cust) => {
      map[toLowerSafe(cust.name)] = cust._id;
      return map;
    }, {});

    const groupMap = existingGroups.reduce((map, gp) => {
      map[toLowerSafe(gp.customerGroupName)] = gp._id;
      return map;
    }, {});

    const existingPolicies = await policyDetailModel.find({}, { policyNumber: 1 });
    const existingPolicyNumbers = new Set(
      existingPolicies
        .map((p) => String(p.policyNumber || "").trim().toLowerCase())
        .filter((p) => p !== "")
    );
    const seenInFile = new Set();

    for (const row of rows) {
      const rawPolicyNumber = getValueByPossibleKeys(row, "POLICY NUMBER", "POLICY NO") || "";
      const policyNumber = String(rawPolicyNumber).trim();
      const policyNumberKey = policyNumber.toLowerCase();

      if (policyNumberKey) {
        if (existingPolicyNumbers.has(policyNumberKey) || seenInFile.has(policyNumberKey)) {
          console.log(`Skipping duplicate policy: ${policyNumber}`);
          continue;
        }
        seenInFile.add(policyNumberKey);
      }

      const clientType = toLowerSafe(getValueByPossibleKeys(row, "CUSTOMER TYPE", "CLIENT TYPE")) || "retail";
      const insuredName = String(getValueByPossibleKeys(row, "INSURED NAME", "CUSTOMER NAME", "CLIENT NAME") || "").trim();
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
              companyId: "68ca95091d6a9cc2b96ae263",
              customerGroupName: insuredName,
              email: email,
              mobile: mobile,
              gstNo: gstNo,
            });
            const savedGroup = await newGroup.save();
            customerGroup = savedGroup._id;
            groupMap[insuredNameKey] = savedGroup._id;

            // Sync with Customer Master
            try {
              const legacyCustomer = new Customer({
                clientType: "corporate",
                customerId: "GRP" + Date.now(),
                customerName: insuredName,
                email: email,
                mobile: mobile,
                gst: gstNo
              });
              await legacyCustomer.save();
            } catch (err) {
              console.error("Error saving corporate group to Customer Master during import:", err);
            }
          }
        } else {
          // Default/retail
          if (customerMap[insuredNameKey]) {
            retailCustomer = customerMap[insuredNameKey];
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
              name: insuredName,
              email: email,
              mobile: mobile,
              gstNo: gstNo,
            });
            const savedCustomer = await newCustomer.save();
            retailCustomer = savedCustomer._id;
            customerMap[insuredNameKey] = savedCustomer._id;

            // Sync with Customer Master
            try {
              const legacyCustomer = new Customer({
                clientType: "retail",
                customerId: nextId,
                customerName: insuredName,
                email: email,
                mobile: mobile,
                gst: gstNo
              });
              await legacyCustomer.save();
            } catch (err) {
              console.error("Error saving retail customer to Customer Master during import:", err);
            }
          }
        }
      }

      const odPremium = Number(getValueByPossibleKeys(row, "OD PREMIUM")) || 0;
      const tpPremium = Number(getValueByPossibleKeys(row, "TP PREMIUM", "TP PREMIUM ")) || 0;
      const netPremium = Number(getValueByPossibleKeys(row, "NET PREMIUM")) || 0;
      const totalAmount = Number(getValueByPossibleKeys(row, "TOTAL PREMIUM ( WITH GST )", "TOTAL PREMIUM", "TOTAL AMOUNT", "GROSS PREMIUM")) || 0;
      const gstAmount = Math.max(0, totalAmount - netPremium);

      const gstRate = netPremium > 0 ? Math.round((gstAmount / netPremium) * 100) : 0;
      const gstDoc = gstPercentages.find(g => Math.round(g.value) === gstRate);
      const gstId = gstDoc?._id || undefined;

      const tpGstAmount = netPremium > 0 ? Math.max(0, Math.round((gstAmount * (tpPremium / netPremium)) * 100) / 100) : 0;
      const odGstAmount = netPremium > 0 ? Math.max(0, Math.round((gstAmount * (odPremium / netPremium)) * 100) / 100) : 0;
      const tpAmount = tpPremium + tpGstAmount;
      const odAmount = odPremium + odGstAmount;

      const expiredDate = excelDateToJSDate(getValueByPossibleKeys(row, "EXPIRED DATE", "EXPIRY DATE", "RENEWAL/ROLLOVER"));

      let startDate = excelDateToJSDate(getValueByPossibleKeys(row, "START DATE", "INCEPTION DATE", "POLICY START DATE", "EFFECTIVE DATE"));
      if (!startDate && expiredDate) {
        startDate = new Date(expiredDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);
      }

      const tpStartDate = tpPremium > 0 ? startDate : undefined;
      const odStartDate = odPremium > 0 ? startDate : undefined;

      const transactionDate = startDate ? new Date(startDate) : undefined;
      if (transactionDate) {
        transactionDate.setDate(transactionDate.getDate() - 2);
      }

      const companyVal = toLowerSafe(getValueByPossibleKeys(row, "COMPANY", "INSURANCE COMPANY"));
      const matchedCompany = companyList.find((c) => {
        const cleanCompany = toLowerSafe(c.name);
        return cleanCompany.includes(companyVal) || companyVal.includes(cleanCompany) || c.key === companyVal.slice(0, 4);
      });
      const insCompanyId = matchedCompany?._id || undefined;
      const insurerName = matchedCompany?.name || getValueByPossibleKeys(row, "COMPANY", "INSURANCE COMPANY") || "";

      const deptVal = toLowerSafe(getValueByPossibleKeys(row, "DEPARTMENT", "DEPT"));
      const insDepartmentId = departmentMap[deptVal] || undefined;

      const prodVal = toLowerSafe(getValueByPossibleKeys(row, "PRODUCT TYPE", "PRODUCT"));
      const productId = products.find((p) => toLowerSafe(p.productName) === prodVal)?._id || undefined;

      policyDetailsArray.push({
        financialYear: findFinancialYearId(getValueByPossibleKeys(row, "Financial Year", "FY")),
        companyId: "68ca95091d6a9cc2b96ae263",
        branchCode: "695386ca12bb6dd679ffa330",
        branchName: "NAGPUR",
        brokerName: "6964ceed36ec87f56adc1332",
        branchBroker: "6964b3a4b2343d2e611ea796",
        cutomerName: insuredName,
        clientType,
        retailCustomer,
        customerGroup,
        mobile,
        email,
        renewable: getValueByPossibleKeys(row, "RENEWAL/ROLLOVER", "RENEWAL") || "RENEWAL",
        vehicleModel: getValueByPossibleKeys(row, "MAKE/MODEL", "MODEL") || "",
        policyNumber: String(getValueByPossibleKeys(row, "POLICY NUMBER", "POLICY NO") || "").trim(),
        odPremium,
        tpPremium,
        netPremium,
        gstAmount,
        totalAmount,
        renewalDate: expiredDate,
        insDepartment: insDepartmentId,
        product: productId,
        insCompany: insCompanyId,
        insurerName,
        tpEndDate: tpPremium > 0 ? expiredDate : undefined,
        odEndDate: odPremium > 0 ? expiredDate : undefined,
        endDate: expiredDate || undefined,
        startDate: startDate || undefined,
        tpStartDate,
        odStartDate,
        transactionDate,
        gst: gstId,
        tpGst: tpPremium > 0 ? gstId : undefined,
        odGst: odPremium > 0 ? gstId : undefined,
        tpGstAmount,
        odGstAmount,
        tpAmount,
        odAmount,
        policyDuration: "YEARLY",
        tpPolicyDuration: tpPremium > 0 ? "YEARLY" : undefined,
        odPolicyDuration: odPremium > 0 ? "YEARLY" : undefined,
        vehicleNumber: getValueByPossibleKeys(row, "VEHICLE NO", "VEHICLE NUMBER") || "",
        paymentMode: getValueByPossibleKeys(row, "PAYMENT MODE") || "online",
        paidAmount: totalAmount,
        gstNo,
      });
    }

    let insertedDocs = [];
    let failedDocs = [];

    try {
      insertedDocs = await policyDetailModel.insertMany(policyDetailsArray, {
        ordered: false,
      });

      return res.status(201).json({
        success: true,
        insertedCount: insertedDocs.length,
        failedCount: 0,
        message: "success",
      });
    } catch (e) {
      console.error(e);

      // documents that WERE inserted
      insertedDocs = e.insertedDocs || [];

      // documents that FAILED
      failedDocs = (e.writeErrors || []).map((err) => ({
        index: err.index,
        error: err.errmsg,
        document: policyDetailsArray[err.index],
      }));

      return res.status(207).json({
        success: false,
        insertedCount: insertedDocs.length,
        failedCount: failedDocs.length,
        failedDocs,
        message: "Partial insert completed",
      });
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: e.message });
  }
};

const exportCsv = async (req, res) => {
  const { financialYear } = req.query;

  // console.log("Inside export controller ", financialYear);

  try {
    const policyData = await policyDetailModel
      .find({
        financialYear: new mongoose.Types.ObjectId(financialYear),
      })
      .populate("insDepartment", "insDepartment")
      .populate("insCompany", "insCompany")
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
        insCompany: obj.insCompany?.insCompany || "",
        brokerName: obj.brokerName?.brokerName || "",
        branchBroker: obj.branchBroker?.branchBroker || "",
        branchCode: obj.branchCode?.branchCode || "",
        prefix: obj.prefix?.prefix || "",
        product: obj.product?.productName || "",
        subProduct: obj.subProduct?.subProductName || "",
        retailCustomer: obj.retailCustomer?.name || "",
        customerGroup: obj.customerGroup?.groupName || obj.customerGroup?.name || "",
        subCustomerGroup: obj.subCustomerGroup?.subCustomerGroup || obj.subCustomerGroup?.name || "",
        gst: obj.gst?.value || "",
        tpGst: obj.tpGst?.value || "",
        odGst: obj.odGst?.value || "",
        rateOnTerr: obj.rateOnTerr?.brokerageRate || "",
        rateOnOtherTerr: obj.rateOnOtherTerr?.brokerageRate || "",
        tpBrokerageRate: obj.tpBrokerageRate?.brokerageRate || "",
        odBrokerageRate: obj.odBrokerageRate?.brokerageRate || "",
        financialYear: `${new Date(obj.financialYear?.fromDate).getFullYear()}-${new Date(obj.financialYear?.toDate).getFullYear()}`,
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
    const excelData = exportData.map((row) => {
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
