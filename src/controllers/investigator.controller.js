const Investigator = require("../models/investigator.model");


// CREATE INVESTIGATOR
exports.createInvestigator = async (req, res) => {
  try {
    const investigator = await Investigator.create(req.body);

    res.status(201).json({
      success: true,
      message: "Investigator created successfully",
      data: investigator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL INVESTIGATORS
exports.getInvestigators = async (req, res) => {
  try {
    const investigators = await Investigator.find();

    res.status(200).json({
      success: true,
      data: investigators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET SINGLE INVESTIGATOR
exports.getSingleInvestigator = async (req, res) => {
  try {
    const investigator = await Investigator.findById(req.params.id);

    if (!investigator) {
      return res.status(404).json({
        success: false,
        message: "Investigator not found",
      });
    }

    res.status(200).json({
      success: true,
      data: investigator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE INVESTIGATOR
exports.updateInvestigator = async (req, res) => {
  try {
    const investigator = await Investigator.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Investigator updated successfully",
      data: investigator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE INVESTIGATOR
exports.deleteInvestigator = async (req, res) => {
  try {
    await Investigator.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Investigator deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};