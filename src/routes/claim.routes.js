const express = require("express");

const router = express.Router();

const {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  assignClaim,
  approveClaim,
  deleteClaim,
  updatePostHospitalization,
  updateLossDetails,
  updateTransportDetails,
} = require("../controllers/claim.controller");

// =========================================
// CREATE CLAIM
// =========================================
router.post("/", createClaim);

// =========================================
// GET ALL CLAIMS
// =========================================
router.get("/", getClaims);

// =========================================
// SPECIAL ACTION ROUTES (IMPORTANT: ABOVE :id)
// =========================================

// ASSIGN CLAIM (Surveyor, TPA, Investigator)
router.put("/:id/assign", assignClaim);

// APPROVE CLAIM
router.put("/:id/approve", approveClaim);

// UPDATE POST HOSPITALIZATION DETAILS
router.put("/:id/post-hospitalization", updatePostHospitalization);

// UPDATE LOSS DETAILS
router.put("/:id/loss-details", updateLossDetails);

// UPDATE TRANSPORT DETAILS
router.put("/:id/transport-details", updateTransportDetails);

// =========================================
// GET SINGLE CLAIM
// =========================================
router.get("/:id", getClaimById);

// =========================================
// UPDATE CLAIM (Full Update)
// =========================================
router.put("/:id", updateClaim);

// =========================================
// DELETE CLAIM
// =========================================
router.delete("/:id", deleteClaim);

module.exports = router;