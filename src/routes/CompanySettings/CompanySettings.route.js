// routes/companySettings.routes.js
const express = require("express");
const companySettingsRouter = express.Router();
const { CompanySettingsController } = require("../../controllers/index");
const { handleToken } = require("../../utils/handleToken");
const upload = require("../../middleware/upload");

// GET routes
companySettingsRouter.get(
  "/",
  CompanySettingsController.getCompanySettingsController
);

companySettingsRouter.get(
  "/:id",
  handleToken,
  CompanySettingsController.getCompanySettingsByIdController
);

companySettingsRouter.get(
  "/:id/logo",
  handleToken,
  CompanySettingsController.getCompanyLogoController
);

// POST route with file upload
companySettingsRouter.post(
  "/",
  handleToken,
  upload.single('companyLogo'),
  CompanySettingsController.postCompanySettingsController
);

// PUT route with file upload
companySettingsRouter.put(
  "/:id",
  handleToken,
  upload.single('companyLogo'),
  CompanySettingsController.putCompanySettingsController
);

// DELETE route
companySettingsRouter.delete(
  "/:id",
  handleToken,
  CompanySettingsController.deleteCompanySettingsController
);

// ✅ ADD THIS - Separate logo upload endpoint
companySettingsRouter.post(
  "/:id/logo",
  handleToken,
  upload.single('companyLogo'),
  CompanySettingsController.uploadCompanyLogoController
);

module.exports = companySettingsRouter;