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
    const investigators = await Investigator.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: investigators.length,
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
        runValidators: true, // Added to run schema validations
      }
    );

    if (!investigator) {
      return res.status(404).json({
        success: false,
        message: "Investigator not found",
      });
    }

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

// DELETE INVESTIGATOR (SOFT DELETE - by updating status)
exports.deleteInvestigator = async (req, res) => {
  try {
    // Option 1: Hard delete (permanently remove from database)
    const investigator = await Investigator.findByIdAndDelete(req.params.id);
    
    // Option 2: Soft delete (just update status to false)
    // const investigator = await Investigator.findByIdAndUpdate(
    //   req.params.id,
    //   { status: false },
    //   { new: true }
    // );

    if (!investigator) {
      return res.status(404).json({
        success: false,
        message: "Investigator not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Investigator deleted successfully",
      data: investigator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SOFT DELETE (Toggle status)
exports.toggleInvestigatorStatus = async (req, res) => {
  try {
    const investigator = await Investigator.findById(req.params.id);
    
    if (!investigator) {
      return res.status(404).json({
        success: false,
        message: "Investigator not found",
      });
    }

    investigator.status = !investigator.status;
    await investigator.save();

    res.status(200).json({
      success: true,
      message: `Investigator ${investigator.status ? 'activated' : 'deactivated'} successfully`,
      data: investigator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ONLY ACTIVE INVESTIGATORS
exports.getActiveInvestigators = async (req, res) => {
  try {
    const investigators = await Investigator.find({ status: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: investigators.length,
      data: investigators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};