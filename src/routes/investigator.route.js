const router = require("express").Router();

const controller = require("../controllers/investigator.controller");


// CREATE
router.post(
  "/",
  controller.createInvestigator
);


// GET ALL
router.get(
  "/",
  controller.getInvestigators
);


// GET SINGLE
router.get(
  "/:id",
  controller.getSingleInvestigator
);


// UPDATE
router.put(
  "/:id",
  controller.updateInvestigator
);


// DELETE
router.delete(
  "/:id",
  controller.deleteInvestigator
);

module.exports = router;