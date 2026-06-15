const { default: mongoose } = require("mongoose");
const ProductOrServiceCategorymodel = require("../../../models/Masters/ProductOrServiceCategory/ProductOrServiceCategory.model");

// ================= POST - Create Product Category =================
const postProductOrServiceCategory = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { productName, department } = req.body;
    
    console.log("Request body:", req.body);
    console.log("CompanyId from query:", companyId);

    // Validation
    if (!productName) {
      return res.status(400).json({
        status: false,
        message: "Product name is required",
      });
    }

    if (!department) {
      return res.status(400).json({
        status: false,
        message: "Department is required",
      });
    }

    if (!companyId) {
      return res.status(400).json({
        status: false,
        message: "Company ID is required",
      });
    }

    const newCategory = new ProductOrServiceCategorymodel({
      companyId,
      productName,
      department,  // Changed from insDepartment to department
    });

    await newCategory.save();

    // Populate the department data before sending response
    const populatedCategory = await ProductOrServiceCategorymodel.findById(newCategory._id)
      .populate("department", "name departmentName department")
      .populate("insDepartment", "insDepartment name departmentName");  // Populate both fields

    res.status(201).json({
      status: true,
      message: "Product created successfully",
      data: populatedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      status: false,
      message: "Server error while creating category",
      error: error.message,
    });
  }
};

// ================= GET - Get All Product Categories =================
const getProductOrServiceCategory = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        status: false,
        message: "Company ID is required",
      });
    }

    const categories = await ProductOrServiceCategorymodel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .populate("department", "name departmentName department")
      .populate("insDepartment", "insDepartment name departmentName")  // Populate both fields
      .sort({ createdAt: -1 });

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        status: true,
        data: [],
        message: "No categories found",
      });
    }

    res.status(200).json({
      status: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: false,
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
};

// ================= PUT - Update Product Category =================
const putProductOrServiceCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { productName, department } = req.body;
    
    console.log("Update request body:", req.body);
    console.log("Category ID:", id);

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Category ID is required",
      });
    }

    // Build update object
    const updateData = {};
    if (productName) updateData.productName = productName;
    if (department) updateData.department = department;

    const updatedCategory = await ProductOrServiceCategorymodel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("department", "name departmentName department")
      .populate("insDepartment", "insDepartment name departmentName");

    console.log("Updated category:", updatedCategory);

    if (!updatedCategory) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      status: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// ================= DELETE - Delete Product Category =================
const deleteProductOrServiceCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Category ID is required",
      });
    }

    const deletedCategory = await ProductOrServiceCategorymodel.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      status: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

module.exports = {
  getProductOrServiceCategory,
  postProductOrServiceCategory,
  putProductOrServiceCategory,
  deleteProductOrServiceCategory,
};