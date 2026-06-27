const CustomerRegistrationModel = require("../../models/Customer/CustomerRegistration.model");
const { SuperAdminModel, AdminModel, TypeOfClientModel } = require("../../models/index");
const mongoose = require("mongoose");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper function to generate unique customer ID
const generateCustomerId = async () => {
  const lastCustomer = await CustomerRegistrationModel.findOne().sort({ createdAt: -1 });
  let nextId = "CUST001";
  
  if (lastCustomer && lastCustomer.customerId) {
    const lastNum = parseInt(lastCustomer.customerId.replace("CUST", ""));
    if (!isNaN(lastNum)) {
      nextId = `CUST${String(lastNum + 1).padStart(3, "0")}`;
    }
  }
  return nextId;
};

// new customer registrations details
const createCustomerRegistration = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const {
      clientType,
      customerId,
      prefix,
      name,
      customerGroupName,
      dob,
      doj,
      email,
      mobile,
      panNo,
      aadharNo,
      drivingLicenseNo,
      gstNo,
      address,
      pincode,
      city,
      state,
      contactPerson,
      authorisedPersonName,
      authorisedPersonContact,
      authorisedPersonEmail,
    } = req.body;

    // Generate customer ID if not provided
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      finalCustomerId = await generateCustomerId();
    }

    // create newCustomerRegistration object
    const newCustomerRegistration = new CustomerRegistrationModel({
      customerType: clientType || "Individual",
      customerId: finalCustomerId,
      prefix: prefix || "",
      name: name ? name.trim() : "",
      customerGroupName: (customerGroupName && customerGroupName.trim() !== "") ? customerGroupName : undefined,
      dob: dob || null,
      doj: doj || new Date(),
      email: email ? email.toLowerCase().trim() : "",
      mobile: mobile ? mobile.trim() : "",
      panNo: panNo ? panNo.toUpperCase().trim() : "",
      aadharNo: aadharNo || "",
      drivingLicenseNo: drivingLicenseNo || "",
      gstNo: gstNo ? gstNo.toUpperCase().trim() : "",
      address: address || "",
      pincode: pincode || "",
      city: city || "",
      state: state || "",
      contactPersons: contactPerson?.map((person) => ({
        name: person?.name?.trim() ?? "",
        department: person?.department?.trim() ?? "",
        position: person?.position?.trim() ?? "",
        email: person?.email?.toLowerCase().trim() ?? "",
        phone: person?.phone?.trim() ?? "",
      })) || [],
      authorisedPersonName: authorisedPersonName || "",
      authorisedPersonContact: authorisedPersonContact || "",
      authorisedPersonEmail: authorisedPersonEmail ? authorisedPersonEmail.toLowerCase().trim() : "",
    });
    
    await newCustomerRegistration.save();
    console.log("Customer registration created successfully");

    res.status(201).json({
      success: true,
      message: "Customer registration created successfully",
      data: newCustomerRegistration,
    });
  } catch (error) {
    console.error("Error creating customer registration:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Customer with this ${field} already exists`,
      });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating customer registration",
      error: error.message,
    });
  }
};

//get all customer registration details
const getAllCustomerRegistration = async (req, res) => {
  try {
    // Add pagination support - only if explicitly provided in query
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const page = hasPagination ? (parseInt(req.query.page) || 1) : null;
    const limit = hasPagination ? (parseInt(req.query.limit) || 10) : null;
    
    // Add search functionality
    const search = req.query.search || "";
    let searchFilter = {};
    
    if (search) {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { customerId: { $regex: search, $options: "i" } }
        ]
      };
    }
    
    // Add filter by customer type
    const customerType = req.query.customerType;
    if (customerType) {
      searchFilter.customerType = customerType;
    }
    
    // Fetch customer registration data
    let customerRegistration;
    let totalCount;
    
    if (hasPagination) {
      const skip = (page - 1) * limit;
      customerRegistration = await CustomerRegistrationModel.find(searchFilter)
        .sort({ createdAt: -1 }) // sort from newest to oldest for lists
        .skip(skip)
        .limit(limit);
      totalCount = await CustomerRegistrationModel.countDocuments(searchFilter);
    } else {
      customerRegistration = await CustomerRegistrationModel.find(searchFilter)
        .sort({ name: 1 }); // sort alphabetically for dropdowns
      totalCount = customerRegistration.length;
    }
    
    if (!customerRegistration || customerRegistration.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No customer registrations found",
        data: [],
        pagination: hasPagination ? {
          total: 0,
          page,
          limit,
          totalPages: 0
        } : undefined
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Customer registrations fetched successfully",
      data: customerRegistration,
      pagination: hasPagination ? {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      } : undefined
    });
  } catch (error) {
    console.error("Error fetching customer registrations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching customer registrations",
      error: error.message
    });
  }
};

// Get single customer registration by ID
const getCustomerRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }
    
    const customerRegistration = await CustomerRegistrationModel.findById(id);
    
    if (!customerRegistration) {
      return res.status(404).json({
        success: false,
        message: "Customer registration not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Customer registration fetched successfully",
      data: customerRegistration,
    });
  } catch (error) {
    console.error("Error fetching customer registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update customer registration
const updateCustomerRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }
    
    // Check if customer exists
    const existingCustomer = await CustomerRegistrationModel.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer registration not found",
      });
    }
    
    // Update contact persons if provided
    if (updateData.contactPerson) {
      updateData.contactPersons = updateData.contactPerson.map((person) => ({
        name: person?.name?.trim() ?? "",
        department: person?.department?.trim() ?? "",
        position: person?.position?.trim() ?? "",
        email: person?.email?.toLowerCase().trim() ?? "",
        phone: person?.phone?.trim() ?? "",
      }));
      delete updateData.contactPerson;
    }

    if (updateData.customerGroupName === "") {
      updateData.customerGroupName = null;
    }
    
    const updatedCustomer = await CustomerRegistrationModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Customer registration updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete customer registration
const deleteCustomerRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }
    
    const deletedCustomer = await CustomerRegistrationModel.findByIdAndDelete(id);
    
    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer registration not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Customer registration deleted successfully",
      data: deletedCustomer,
    });
  } catch (error) {
    console.error("Error deleting customer registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomerRegistration,
  getAllCustomerRegistration,
  getCustomerRegistrationById,
  updateCustomerRegistration,
  deleteCustomerRegistration,
};