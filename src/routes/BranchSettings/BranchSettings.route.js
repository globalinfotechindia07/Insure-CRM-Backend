// routes/branchSettings.routes.js
const express = require("express");
const branchSettingsRouter = express.Router();
const { BranchSettingsController } = require("../../controllers/index");
const { handleToken } = require("../../utils/handleToken");
const upload = require("../../middleware/upload");

// GET routes
branchSettingsRouter.get(
  "/",
  BranchSettingsController.getBranchSettingsController
);

branchSettingsRouter.get(
  "/:id",
  handleToken,
  BranchSettingsController.getBranchSettingsByIdController
);

// Get branch settings by refId
branchSettingsRouter.get(
  "/ref/:refId",
  handleToken,
  BranchSettingsController.getBranchSettingsByRefId
);

branchSettingsRouter.get(
  "/:id/logo",
  handleToken,
  BranchSettingsController.getBranchLogoController
);

// POST route with file upload
branchSettingsRouter.post(
  "/",
  handleToken,
  upload.single('branchLogo'),
  BranchSettingsController.postBranchSettingsController
);

// PUT route with file upload
branchSettingsRouter.put(
  "/:id",
  handleToken,
  upload.single('branchLogo'),
  BranchSettingsController.putBranchSettingsController
);

// DELETE route
branchSettingsRouter.delete(
  "/:id",
  handleToken,
  BranchSettingsController.deleteBranchSettingsController
);

// Separate logo upload endpoint
branchSettingsRouter.post(
  "/:id/logo",
  handleToken,
  upload.single('branchLogo'),
  BranchSettingsController.uploadBranchLogoController
);

module.exports = branchSettingsRouter;
