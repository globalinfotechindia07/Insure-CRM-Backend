const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductOrServiceCategorySchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",  // Changed from insDepartment to Department
      set: (v) => (v === "" ? null : v),
      required: true,  // Make it required
    },
    productName: { 
      type: String, 
      required: true 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

const ProductOrServiceCategorymodel = mongoose.model(
  "ProductOrServiceCategory",
  ProductOrServiceCategorySchema
);
module.exports = ProductOrServiceCategorymodel;