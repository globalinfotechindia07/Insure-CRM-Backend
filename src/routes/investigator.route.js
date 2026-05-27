const router = require("express").Router();
const controller = require("../controllers/investigator.controller");

// CREATE
router.post("/", controller.createInvestigator);

// GET ALL
router.get("/", controller.getInvestigators);

// GET ACTIVE INVESTIGATORS ONLY
router.get("/active", controller.getActiveInvestigators);

// GET SINGLE
router.get("/:id", controller.getSingleInvestigator);

// UPDATE
router.put("/:id", controller.updateInvestigator);

// DELETE (Hard delete)
router.delete("/:id", controller.deleteInvestigator);

// SOFT DELETE (Toggle status)
router.patch("/:id/toggle-status", controller.toggleInvestigatorStatus);

module.exports = router;