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

// ASSIGN CLAIM
router.put("/:id/assign", assignClaim);

// APPROVE CLAIM
router.put("/:id/approve", approveClaim);


// =========================================
// GET SINGLE CLAIM
// =========================================
router.get("/:id", getClaimById);


// =========================================
// UPDATE CLAIM
// =========================================
router.put("/:id", updateClaim);


// =========================================
// DELETE CLAIM
// =========================================
router.delete("/:id", deleteClaim);


module.exports = router;