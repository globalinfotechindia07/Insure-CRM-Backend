const TPA = require("../models/tpa.model");

// CREATE
exports.createTPA = async (req, res) => {
  try {

    const {
      tpaName,
      contactNo,
      email,
      address,
      status,
    } = req.body;

    const tpa = await TPA.create({
      tpaName,
      contactNo,
      email,
      address,
      status,
    });

    res.status(201).json({
      success: true,
      message: "TPA created successfully",
      data: tpa,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// GET ALL
exports.getTPAs = async (req, res) => {
  try {

    const data = await TPA.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// GET SINGLE
exports.getTPAById = async (req, res) => {
  try {

    const tpa = await TPA.findById(
      req.params.id
    );

    if (!tpa) {

      return res.status(404).json({
        success: false,
        message: "TPA not found",
      });

    }

    res.status(200).json({
      success: true,
      data: tpa,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// UPDATE
exports.updateTPA = async (req, res) => {
  try {

    const tpa =
      await TPA.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!tpa) {

      return res.status(404).json({
        success: false,
        message: "TPA not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "TPA updated successfully",
      data: tpa,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// DELETE
exports.deleteTPA = async (req, res) => {
  try {

    const tpa =
      await TPA.findByIdAndDelete(
        req.params.id
      );

    if (!tpa) {

      return res.status(404).json({
        success: false,
        message: "TPA not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "TPA deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};