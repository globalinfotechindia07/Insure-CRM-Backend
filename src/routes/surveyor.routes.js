const router = require("express").Router();

const controller = require("../controllers/surveyor.controller");

// CREATE
router.post(
  "/",
  controller.createSurveyor
);

// GET ALL
router.get(
  "/",
  controller.getSurveyors
);

// GET SINGLE
router.get(
  "/:id",
  controller.getSurveyorById
);

// UPDATE
router.put(
  "/:id",
  controller.updateSurveyor
);

// DELETE
router.delete(
  "/:id",
  controller.deleteSurveyor
);

module.exports = router;