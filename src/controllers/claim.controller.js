const Claim = require("../models/claim.model");
const Policy = require("../models/policy.model");

// =========================================
// COMMON POPULATE FUNCTION
// =========================================
const populateAll = (query) => {
  return query
    .populate("policyId")
    .populate("surveyorId")   // ✅ only one surveyor
    .populate("tpaId")
    .populate("investigatorId");
};


// =========================================
// CREATE CLAIM
// =========================================
exports.createClaim = async (req, res) => {
  try {
    let payload = { ...req.body };

    // AUTO POLICY DATA
    if (payload.policyId) {
      const policy = await Policy.findById(payload.policyId);

      if (policy) {
        payload = {
          ...payload,
          policyNo: policy.policyNo,
          insuredName: policy.insuredName,
          contactNo: policy.contactNo,
          email: policy.email,
          contactPerson: policy.contactPerson,
          policyDepartment: policy.department,
          locationOfProperty: policy.location,
          renewalOrNewPolicy: policy.renewalType,
          typeOfPolicy: policy.typeOfPolicy,
          wording: policy.wording,
          additionalWordings: policy.additionalWordings,
          financialInstitutionsAndLenders: policy.financialInstitutions,
          briefDescriptionOfProperty: policy.propertyDescription,
          sumInsured: policy.sumInsured,
          periodOfInsurance: policy.insurancePeriod,
          insurerName: policy.insurerName,
          vehicleNumber: policy.vehicleNumber,
          netPremium: policy.netPremium,
          gst: policy.gst,
          totalAmount: policy.totalAmount,
          paymentMode: policy.paymentMode,
        };
      }
    }

    const data = await Claim.create(payload);

    const populatedData = await populateAll(
      Claim.findById(data._id)
    );

    res.status(201).json({
      success: true,
      message: "Claim Created Successfully",
      data: populatedData,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// GET ALL CLAIMS
// =========================================
exports.getClaims = async (req, res) => {
  try {
    const data = await populateAll(
      Claim.find().sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// GET SINGLE CLAIM
// =========================================
exports.getClaimById = async (req, res) => {
  try {
    const data = await populateAll(
      Claim.findById(req.params.id)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// UPDATE CLAIM
// =========================================
exports.updateClaim = async (req, res) => {
  try {
    const data = await populateAll(
      Claim.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Claim Updated Successfully",
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// ASSIGN CLAIM
// =========================================
exports.assignClaim = async (req, res) => {
  try {
    const updateFields = {
      surveyorId: req.body.surveyorId,   // ✅ only one surveyor
      tpaId: req.body.tpaId,
      investigatorId: req.body.investigatorId,
    };

    const data = await populateAll(
      Claim.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      )
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Claim Assigned Successfully",
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// APPROVE CLAIM
// =========================================
exports.approveClaim = async (req, res) => {
  try {
    const updateFields = {
      status: req.body.status,
      approvedAmount: req.body.approvedAmount,
      settlementType: req.body.settlementType,
      approvalDate: req.body.approvalDate,
      settlementDate: req.body.settlementDate,
      remarks: req.body.remarks,
    };

    const data = await Claim.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Claim Approved Successfully",
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// DELETE CLAIM
// =========================================
exports.deleteClaim = async (req, res) => {
  try {
    const data = await Claim.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Claim Deleted Successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};