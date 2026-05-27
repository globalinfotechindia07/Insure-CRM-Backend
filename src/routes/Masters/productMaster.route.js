const express = require("express");
const productMasterRouter = express.Router();
const {
  getProductOrServiceCategory,
  postProductOrServiceCategory,
  putProductOrServiceCategory,
  deleteProductOrServiceCategory,
} = require("../../controllers/Masters/ProductOrServiceCategory/ProductOrServiceCategory.controller");
const { handleToken } = require('../../utils/handleToken');

// ================= PRODUCT/SERVICE CATEGORY ROUTES =================

// Create new product category
productMasterRouter.post("/", handleToken, postProductOrServiceCategory);

// Get all product categories
productMasterRouter.get("/", handleToken, getProductOrServiceCategory);

// Update product category
productMasterRouter.put("/:id", handleToken, putProductOrServiceCategory);

// Delete product category
productMasterRouter.delete("/:id", handleToken, deleteProductOrServiceCategory);

module.exports = productMasterRouter;