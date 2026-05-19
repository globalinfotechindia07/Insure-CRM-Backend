const {
  companySettingsModel,
  ClientRegistrationModel,
} = require("../../models/index");
const fs = require('fs');
const path = require('path');

const getCompanySettingsController = async (req, res) => {
  try {
    const companySettings = await companySettingsModel.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "true", data: companySettings });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching company settings", error.message],
    });
  }
};

const getCompanySettingsByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("company setting id is", id);
    const companySettings = await companySettingsModel.findById(id);
    console.log("company setting is", companySettings);
    if (!companySettings) {
      return res
        .status(404)
        .json({ status: "false", message: "Company settings not found" });
    }
    res.status(200).json({ status: "true", data: companySettings });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching company settings by ID", error.message],
    });
  }
};

// ✅ NEW: Get company settings by refId
const getCompanySettingsByRefId = async (req, res) => {
  try {
    const { refId } = req.params;
    console.log("🔍 Fetching company settings for refId:", refId);
    
    const companySettings = await companySettingsModel.findOne({ refId: refId });
    
    if (!companySettings) {
      return res.status(404).json({ 
        status: "false", 
        message: "Company settings not found for this refId" 
      });
    }
    
    res.status(200).json({ status: "true", data: companySettings });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      status: "false",
      message: ["Error fetching company settings by refId", error.message],
    });
  }
};

const postCompanySettingsController = async (req, res) => {
  try {
    console.log("📦 Request Body:", req.body);
    console.log("📦 Request File:", req.file);
    
    // Prepare company data
    let companyData = {};
    
    // Handle FormData (fields can be strings or arrays)
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        companyData[key] = req.body[key];
      }
    }
    
    // Parse locations if it's a JSON string (coming from FormData)
    if (companyData.locations && typeof companyData.locations === 'string') {
      try {
        companyData.locations = JSON.parse(companyData.locations);
      } catch (e) {
        console.error("Error parsing locations:", e);
        companyData.locations = {
          exportCenter: [],
          factories: [],
          warehouse: [],
          branches: []
        };
      }
    }
    
    // Handle logo file upload
    if (req.file) {
      companyData.companyLogo = `/uploads/company-logo/${req.file.filename}`;
    }
    
    // Remove undefined or empty strings
    Object.keys(companyData).forEach(key => {
      if (companyData[key] === undefined || companyData[key] === 'undefined') {
        delete companyData[key];
      }
    });
    
    console.log("📦 Final Company Data:", companyData);
    
    const newCompany = new companySettingsModel(companyData);
    const savedCompany = await newCompany.save();
    
    res.status(201).json({ status: "true", data: savedCompany });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(400).json({
      status: "false",
      message: "Error saving company settings",
      error: error.message,
    });
  }
};

const putCompanySettingsController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating company ID:", id);
    console.log("📦 Request Body:", req.body);
    console.log("📦 Request File:", req.file);
    
    // Prepare update data
    let updateData = {};
    
    // Handle FormData
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        updateData[key] = req.body[key];
      }
    }
    
    // Parse locations if it's a JSON string
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
    
    // Handle logo file upload - Delete old logo if exists
    if (req.file) {
      // Get existing company to delete old logo
      const existingCompany = await companySettingsModel.findById(id);
      if (existingCompany && existingCompany.companyLogo) {
        const oldLogoPath = path.join(__dirname, '..', existingCompany.companyLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
          console.log("✅ Old logo deleted:", oldLogoPath);
        }
      }
      updateData.companyLogo = `/uploads/company-logo/${req.file.filename}`;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === 'undefined') {
        delete updateData[key];
      }
    });
    
    console.log("📦 Final Update Data:", updateData);
    
    const updatedCompany = await companySettingsModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    );
    
    if (!updatedCompany) {
      return res
        .status(404)
        .json({ status: "false", message: "Company not found" });
    }
    
    res.status(200).json({ status: "true", data: updatedCompany });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(400).json({
      status: "false",
      message: ["Error updating company settings", error.message],
    });
  }
};

const deleteCompanySettingsController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete logo file if exists
    const company = await companySettingsModel.findById(id);
    if (company && company.companyLogo) {
      const logoPath = path.join(__dirname, '..', company.companyLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
        console.log("✅ Logo deleted:", logoPath);
      }
    }
    
    const deletedCompany = await companySettingsModel.findByIdAndDelete(id);
    if (!deletedCompany) {
      return res
        .status(404)
        .json({ status: "false", message: "Company not found" });
    }
    res
      .status(200)
      .json({ status: "true", message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error deleting company settings", error.message],
    });
  }
};

const getCompanyLogoController = async (req, res) => {
  try {
    const { id } = req.params;
    const companySettings = await ClientRegistrationModel.findById(id);
    if (!companySettings || !companySettings.logo) {
      return res
        .status(404)
        .json({ status: "false", message: "Company logo not found" });
    }
    res.status(200).json({ status: "true", logo: companySettings.logo });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching company logo", error.message],
    });
  }
};

// Separate logo upload endpoint
const uploadCompanyLogoController = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("🖼️ Uploading logo for company ID:", id);
    console.log("📦 Request File:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ 
        status: "false", 
        message: "No file uploaded" 
      });
    }
    
    const logoPath = `/uploads/company-logo/${req.file.filename}`;
    
    // Delete old logo if exists
    const existingCompany = await companySettingsModel.findById(id);
    if (existingCompany && existingCompany.companyLogo) {
      const oldLogoPath = path.join(__dirname, '..', existingCompany.companyLogo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
        console.log("✅ Old logo deleted:", oldLogoPath);
      }
    }
    
    const updatedCompany = await companySettingsModel.findByIdAndUpdate(
      id,
      { companyLogo: logoPath },
      { new: true }
    );
    
    if (!updatedCompany) {
      return res.status(404).json({ 
        status: "false", 
        message: "Company not found" 
      });
    }
    
    res.status(200).json({ 
      status: "true", 
      message: "Logo uploaded successfully",
      data: { companyLogo: logoPath }
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
  getCompanySettingsController,
  getCompanySettingsByIdController,
  getCompanySettingsByRefId,  // ✅ Added this
  postCompanySettingsController,
  putCompanySettingsController,
  deleteCompanySettingsController,
  getCompanyLogoController,
  uploadCompanyLogoController,
};