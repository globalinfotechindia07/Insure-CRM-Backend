const mongoose = require("mongoose");
const { policyDetailModel } = require("../../models/index");
const { insDepartmentModel } = require("../../models/index");
const { insCompanyModel } = require("../../models/index");
const ProductOrServiceCategorymodel = require("../../models/Masters/ProductOrServiceCategory/ProductOrServiceCategory.model");

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

    // 📝 Create new AdminClientRegistration document
    const newPolicyDetail = new policyDetailModel({
      financialYear: req.body.financialYear || undefined,
      clientType: req.body.clientType || undefined,
      retailCustomer: req.body.retailCustomer || undefined,
      customerGroup: req.body.customerGroup || undefined,
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

    res.status(200).json({
      success: true,
      data: policy,
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

    const excelDateToJSDate = (excelDate) => {
      if (!excelDate) return null;
      if (typeof excelDate === "string") {
        if (/^\d+$/.test(excelDate.trim())) {
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

    const policyDetailsArray = rows.map((row) => ({
      financialYear: row["Financial Year"] || undefined,
      companyId: "68ca95091d6a9cc2b96ae263",
      branchCode: "695386ca12bb6dd679ffa330",
      branchName: "NAGPUR",
      brokerName: "6964ceed36ec87f56adc1332",
      branchBroker: "6964b3a4b2343d2e611ea796",
      cutomerName: row["INSURED NAME"]?.trim() || "",
      clientType: toLowerSafe(row["CUSTOMER TYPE"]), // RETAIL → retail
      mobile: row["MOBILE NO"] || "",
      email: row["MAIL ID"] || "",
      renewable: row["RENEWAL/ROLLOVER"],
      vehicleModel: row["MAKE/MODEL"] || "",
      policyNumber: String(row["POLICY NUMBER"] || "").trim(),
      odPremium: Number(row["OD PREMIUM"]) || 0,
      tpPremium: Number(row["TP PREMIUM "]) || 0,
      netPremium: Number(row["NET PREMIUM"]) || 0,
      totalAmount: Number(row["TOTAL PREMIUM ( WITH GST )"]) || 0,
      renewalDate: excelDateToJSDate(row["EXPIRED DATE"]),
      insDepartment: departmentMap[toLowerSafe(row["DEPARTMENT"])] || undefined,

      product:
        products.find(
          (p) =>
            toLowerSafe(p.productName) === toLowerSafe(row["PRODUCT TYPE"]),
        )?._id || undefined,

      insCompany:
        companyList.find(
          (c) => c.key === toLowerSafe(row["COMPANY"]).slice(0, 4),
        )?._id || undefined,

      insurerName:
        companyList.find(
          (c) => c.key === toLowerSafe(row["COMPANY"]).slice(0, 4),
        )?.name || row["COMPANY"],
      tpEndDate:
        Number(row["TP PREMIUM "]) > 0
          ? excelDateToJSDate(row["EXPIRED DATE"])
          : "",
      odEndDate:
        Number(row["OD PREMIUM "]) > 0
          ? excelDateToJSDate(row["EXPIRED DATE"])
          : "",
      endDate: excelDateToJSDate(row["EXPIRED DATE"]) || "",
      vehicleNumber: row["VEHICLE NO"] || "",
      paymentMode: row["PAYMENT MODE"],
      paidAmount: Number(row["TOTAL PREMIUM ( WITH GST )"]) || 0,
      gstNo: row["GST/UDYOG AADHAAR"] || "",
    }));

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
      .populate("brokerName");

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
};
