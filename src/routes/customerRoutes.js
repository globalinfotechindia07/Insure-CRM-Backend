const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  deleteCustomer,
} = require("../controllers/customerController");

// CREATE
router.post("/", createCustomer);

// GET ALL
router.get("/", getCustomers);

// DELETE
router.delete("/:id", deleteCustomer);

module.exports = router;