const Claim = require("../models/claim.model");
const Policy = require("../models/policy.model");
const Surveyor = require("../models/surveyor.model");
const TPA = require("../models/tpa.model");
const Investigator = require("../models/investigator.model");

// =========================================
// COMMON POPULATE FUNCTION (UPDATED)
// =========================================
const populateAll = (query) => {
  return query
    .populate("policyId")
    .populate("preliminarySurveyorId")  // ✅ Preliminary Surveyor
    .populate("finalSurveyorId")        // ✅ Final Surveyor
    .populate("tpaId")                  // ✅ TPA
    .populate("investigatorId");        // ✅ Investigator
};

// =========================================
// CREATE CLAIM (UPDATED)
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

    // Auto-fill names from IDs
    if (payload.preliminarySurveyorId) {
      const surveyor = await Surveyor.findById(payload.preliminarySurveyorId);
      if (surveyor) payload.preliminarySurveyorName = surveyor.surveyorName;
    }

    if (payload.finalSurveyorId) {
      const surveyor = await Surveyor.findById(payload.finalSurveyorId);
      if (surveyor) payload.finalSurveyorName = surveyor.surveyorName;
    }

    if (payload.tpaId) {
      const tpa = await TPA.findById(payload.tpaId);
      if (tpa) payload.tpaName = tpa.tpaName;
    }

    if (payload.investigatorId) {
      const investigator = await Investigator.findById(payload.investigatorId);
      if (investigator) payload.investigatorName = investigator.investigatorName;
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
// UPDATE CLAIM (UPDATED)
// =========================================
exports.updateClaim = async (req, res) => {
  try {
    let payload = { ...req.body };

    // Auto-fill names from IDs if they are being updated
    if (payload.preliminarySurveyorId) {
      const surveyor = await Surveyor.findById(payload.preliminarySurveyorId);
      if (surveyor) payload.preliminarySurveyorName = surveyor.surveyorName;
    }

    if (payload.finalSurveyorId) {
      const surveyor = await Surveyor.findById(payload.finalSurveyorId);
      if (surveyor) payload.finalSurveyorName = surveyor.surveyorName;
    }

    if (payload.tpaId) {
      const tpa = await TPA.findById(payload.tpaId);
      if (tpa) payload.tpaName = tpa.tpaName;
    }

    if (payload.investigatorId) {
      const investigator = await Investigator.findById(payload.investigatorId);
      if (investigator) payload.investigatorName = investigator.investigatorName;
    }

    const data = await populateAll(
      Claim.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true, runValidators: true }
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
// ASSIGN CLAIM (UPDATED - for surveyor/tpa/investigator)
// =========================================
exports.assignClaim = async (req, res) => {
  try {
    let updateFields = {
      preliminarySurveyorId: req.body.preliminarySurveyorId,
      finalSurveyorId: req.body.finalSurveyorId,
      tpaId: req.body.tpaId,
      investigatorId: req.body.investigatorId,
    };

    // Auto-fill names
    if (req.body.preliminarySurveyorId) {
      const surveyor = await Surveyor.findById(req.body.preliminarySurveyorId);
      if (surveyor) updateFields.preliminarySurveyorName = surveyor.surveyorName;
    }

    if (req.body.finalSurveyorId) {
      const surveyor = await Surveyor.findById(req.body.finalSurveyorId);
      if (surveyor) updateFields.finalSurveyorName = surveyor.surveyorName;
    }

    if (req.body.tpaId) {
      const tpa = await TPA.findById(req.body.tpaId);
      if (tpa) updateFields.tpaName = tpa.tpaName;
    }

    if (req.body.investigatorId) {
      const investigator = await Investigator.findById(req.body.investigatorId);
      if (investigator) updateFields.investigatorName = investigator.investigatorName;
    }

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
// APPROVE CLAIM (UPDATED)
// =========================================
exports.approveClaim = async (req, res) => {
  try {
    const updateFields = {
      status: req.body.status,
      claimApprovedAmount: req.body.claimApprovedAmount,
      settlementType: req.body.settlementType,
      dateOfApprovalOfClaim: req.body.dateOfApprovalOfClaim,
      dateOfSettlement: req.body.dateOfSettlement,
      remarks: req.body.remarks,
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
// UPDATE POST HOSPITALIZATION
// =========================================
exports.updatePostHospitalization = async (req, res) => {
  try {
    const data = await populateAll(
      Claim.findByIdAndUpdate(
        req.params.id,
        {
          postHospitalization: {
            dischargeDate: req.body.dischargeDate,
            amountClaimed: req.body.amountClaimed,
            noOfDays: req.body.noOfDays,
          }
        },
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
      message: "Post Hospitalization Details Updated Successfully",
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
// UPDATE LOSS DETAILS
// =========================================
exports.updateLossDetails = async (req, res) => {
  try {
    const updateFields = {
      dateOfLossOrAdmission: req.body.dateOfLossOrAdmission,
      dateOfDischarge: req.body.dateOfDischarge,
      estimatedLossAmount: req.body.estimatedLossAmount,
      causeOfLoss: req.body.causeOfLoss,
      machineryDetails: req.body.machineryDetails,
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
      message: "Loss Details Updated Successfully",
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
// UPDATE TRANSPORT DETAILS
// =========================================
exports.updateTransportDetails = async (req, res) => {
  try {
    const updateFields = {
      invoiceNo: req.body.invoiceNo,
      billOfLadingNo: req.body.billOfLadingNo,
      lrNo: req.body.lrNo,
      insuranceCertificateNo: req.body.insuranceCertificateNo,
      journeyFrom: req.body.journeyFrom,
      journeyTo: req.body.journeyTo,
      surveyorReferenceNumber: req.body.surveyorReferenceNumber,
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
      message: "Transport Details Updated Successfully",
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