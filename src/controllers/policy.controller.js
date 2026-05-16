const Policy = require("../models/policy.model");

// ================= CREATE POLICY =================

exports.createPolicy = async (req, res) => {

  try {

    const policy = await Policy.create(req.body);

    res.status(201).json({
      success: true,
      message: "Policy created successfully",
      data: policy,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ================= GET ALL POLICIES =================

exports.getPolicies = async (req, res) => {

  try {

    const policies = await Policy.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: policies,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ================= GET SINGLE POLICY =================

exports.getSinglePolicy = async (req, res) => {

  try {

    const policy = await Policy.findById(
      req.params.id
    );

    if (!policy) {

      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });

    }

    res.status(200).json({
      success: true,
      data: policy,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ================= UPDATE POLICY =================

exports.updatePolicy = async (req, res) => {

  try {

    const policy =
      await Policy.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!policy) {

      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Policy updated successfully",
      data: policy,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ================= DELETE POLICY =================

exports.deletePolicy = async (req, res) => {

  try {

    const policy =
      await Policy.findByIdAndDelete(
        req.params.id
      );

    if (!policy) {

      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Policy deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};