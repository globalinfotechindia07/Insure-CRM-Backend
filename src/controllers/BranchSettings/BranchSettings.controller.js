const {
  branchSettingsModel,
  ClientRegistrationModel,
} = require("../../models/index");
const fs = require('fs');
const path = require('path');

const getBranchSettingsController = async (req, res) => {
  try {
    const branchSettings = await branchSettingsModel.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "true", data: branchSettings });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching branch settings", error.message],
    });
  }
};

const getBranchSettingsByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("branch setting id is", id);
    const branchSettings = await branchSettingsModel.findById(id);
    console.log("branch setting is", branchSettings);
    if (!branchSettings) {
      return res
        .status(404)
        .json({ status: "false", message: "Branch settings not found" });
    }
    res.status(200).json({ status: "true", data: branchSettings });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching branch settings by ID", error.message],
    });
  }
};

const getBranchSettingsByRefId = async (req, res) => {
  try {
    const { refId } = req.params;
    console.log("🔍 Fetching branch settings for refId:", refId);
    
    const branchSettings = await branchSettingsModel.findOne({ refId: refId });
    
    if (!branchSettings) {
      return res.status(404).json({ 
        status: "false", 
        message: "Branch settings not found for this refId" 
      });
    }
    
    res.status(200).json({ status: "true", data: branchSettings });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      status: "false",
      message: ["Error fetching branch settings by refId", error.message],
    });
  }
};

const postBranchSettingsController = async (req, res) => {
  try {
    console.log("📦 Request Body:", req.body);
    console.log("📦 Request File:", req.file);
    
    let branchData = {};
    
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        branchData[key] = req.body[key];
      }
    }
    
    if (branchData.locations && typeof branchData.locations === 'string') {
      try {
        branchData.locations = JSON.parse(branchData.locations);
      } catch (e) {
        console.error("Error parsing locations:", e);
        branchData.locations = {
          exportCenter: [],
          factories: [],
          warehouse: [],
          branches: []
        };
      }
    }
    
    if (req.file) {
      branchData.branchLogo = `/uploads/company-logo/${req.file.filename}`;
    }
    
    Object.keys(branchData).forEach(key => {
      if (branchData[key] === undefined || branchData[key] === 'undefined') {
        delete branchData[key];
      }
    });
    
    console.log("📦 Final Branch Data:", branchData);
    
    const newBranch = new branchSettingsModel(branchData);
    const savedBranch = await newBranch.save();
    
    res.status(201).json({ status: "true", data: savedBranch });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(400).json({
      status: "false",
      message: "Error saving branch settings",
      error: error.message,
    });
  }
};

const putBranchSettingsController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating branch ID:", id);
    console.log("📦 Request Body:", req.body);
    console.log("📦 Request File:", req.file);
    
    let updateData = {};
    
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        updateData[key] = req.body[key];
      }
    }
    
    if (updateData.locations && typeof updateData.locations === 'string') {
      try {
        updateData.locations = JSON.parse(updateData.locations);
      } catch (e) {
        console.error("Error parsing locations:", e);
        updateData.locations = {
          exportCenter: [],
          factories: [],
          warehouse: [],
          branches: []
        };
      }
    }
    
    if (req.file) {
      const existingBranch = await branchSettingsModel.findById(id);
      if (existingBranch && existingBranch.branchLogo) {
        const oldLogoPath = path.join(__dirname, '..', '..', existingBranch.branchLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
          console.log("✅ Old logo deleted:", oldLogoPath);
        }
      }
      updateData.branchLogo = `/uploads/company-logo/${req.file.filename}`;
    }
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === 'undefined') {
        delete updateData[key];
      }
    });
    
    console.log("📦 Final Update Data:", updateData);
    
    const updatedBranch = await branchSettingsModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    );
    
    if (!updatedBranch) {
      return res
        .status(404)
        .json({ status: "false", message: "Branch not found" });
    }
    
    res.status(200).json({ status: "true", data: updatedBranch });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(400).json({
      status: "false",
      message: ["Error updating branch settings", error.message],
    });
  }
};

const deleteBranchSettingsController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await branchSettingsModel.findById(id);
    if (branch && branch.branchLogo) {
      const logoPath = path.join(__dirname, '..', '..', branch.branchLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
        console.log("✅ Logo deleted:", logoPath);
      }
    }
    
    const deletedBranch = await branchSettingsModel.findByIdAndDelete(id);
    if (!deletedBranch) {
      return res
        .status(404)
        .json({ status: "false", message: "Branch not found" });
    }
    res
      .status(200)
      .json({ status: "true", message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error deleting branch settings", error.message],
    });
  }
};

const getBranchLogoController = async (req, res) => {
  try {
    const { id } = req.params;
    const branchSettings = await ClientRegistrationModel.findById(id);
    if (!branchSettings || !branchSettings.logo) {
      return res
        .status(404)
        .json({ status: "false", message: "Branch logo not found" });
    }
    res.status(200).json({ status: "true", logo: branchSettings.logo });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching branch logo", error.message],
    });
  }
};

const uploadBranchLogoController = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("🖼️ Uploading logo for branch ID:", id);
    console.log("📦 Request File:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ 
        status: "false", 
        message: "No file uploaded" 
      });
    }
    
    const logoPath = `/uploads/company-logo/${req.file.filename}`;
    
    const existingBranch = await branchSettingsModel.findById(id);
    if (existingBranch && existingBranch.branchLogo) {
      const oldLogoPath = path.join(__dirname, '..', '..', existingBranch.branchLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
        console.log("✅ Old logo deleted:", oldLogoPath);
      }
    }
    
    const updatedBranch = await branchSettingsModel.findByIdAndUpdate(
      id,
      { branchLogo: logoPath },
      { new: true }
    );
    
    if (!updatedBranch) {
      return res.status(404).json({ 
        status: "false", 
        message: "Branch not found" 
      });
    }
    
    res.status(200).json({ 
      status: "true", 
      message: "Logo uploaded successfully",
      data: { branchLogo: logoPath }
    });
  } catch (error) {
    console.error("❌ Error uploading logo:", error);
    res.status(500).json({
      status: "false",
      message: ["Error uploading logo", error.message],
    });
  }
};

module.exports = {
  getBranchSettingsController,
  getBranchSettingsByIdController,
  getBranchSettingsByRefId,
  postBranchSettingsController,
  putBranchSettingsController,
  deleteBranchSettingsController,
  getBranchLogoController,
  uploadBranchLogoController,
};
