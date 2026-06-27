const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  deleteCustomer,
  updateCustomer,
} = require("../controllers/customerController");

// CREATE
router.post("/", createCustomer);

// GET ALL
router.get("/", getCustomers);

// DELETE
router.delete("/:id", deleteCustomer);

// UPDATE
router.put("/:id", updateCustomer);

module.exports = router;