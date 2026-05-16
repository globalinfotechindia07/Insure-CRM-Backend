const router = require("express").Router();

const controller = require("../controllers/tpa.controller");

// CREATE
router.post("/", controller.createTPA);

// GET ALL
router.get("/", controller.getTPAs);

// GET SINGLE
router.get("/:id", controller.getTPAById);

// UPDATE
router.put("/:id", controller.updateTPA);

// DELETE
router.delete("/:id", controller.deleteTPA);

module.exports = router;