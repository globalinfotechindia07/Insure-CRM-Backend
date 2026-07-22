const Surveyor = require("../models/surveyor.model");

// CREATE
exports.createSurveyor = async (req, res) => {
  try {

    const {
      surveyorName,
      companyName,
      licenseNo,
      expiryDate,
      categories,
      contactNo,
      email,
      surveyors,
      address,
      status,
    } = req.body;

    const surveyor = await Surveyor.create({
      surveyorName: surveyorName || (surveyors && surveyors[0] ? surveyors[0].name : ""),
      companyName,
      licenseNo,
      expiryDate,
      categories,
      contactNo: contactNo || (surveyors && surveyors[0] ? surveyors[0].contactNo : ""),
      email: email || (surveyors && surveyors[0] ? surveyors[0].email : ""),
      surveyors,
      address,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Surveyor created successfully",
      data: surveyor,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// GET ALL
exports.getSurveyors = async (req, res) => {
  try {

    const surveyors = await Surveyor.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: surveyors.length,
      data: surveyors,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// GET SINGLE
exports.getSurveyorById = async (req, res) => {
  try {

    const surveyor =
      await Surveyor.findById(req.params.id);

    if (!surveyor) {

      return res.status(404).json({
        success: false,
        message: "Surveyor not found",
      });

    }

    res.status(200).json({
      success: true,
      data: surveyor,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// UPDATE
exports.updateSurveyor = async (req, res) => {
  try {

    if (req.body.surveyors && req.body.surveyors.length > 0) {
      req.body.surveyorName = req.body.surveyors[0].name || "";
      req.body.contactNo = req.body.surveyors[0].contactNo || "";
      req.body.email = req.body.surveyors[0].email || "";
    }

    const surveyor =
      await Surveyor.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!surveyor) {

      return res.status(404).json({
        success: false,
        message: "Surveyor not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Surveyor updated successfully",
      data: surveyor,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// DELETE
exports.deleteSurveyor = async (req, res) => {
  try {

    const surveyor =
      await Surveyor.findByIdAndDelete(
        req.params.id
      );

    if (!surveyor) {

      return res.status(404).json({
        success: false,
        message: "Surveyor not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Surveyor deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};