const { CustomerRegistrationModel } = require("../models/index");
const mongoose = require("mongoose");

// ✅ CREATE
exports.createCustomer = async (req, res) => {
  try {
    const body = req.body;
    const {
      clientType,
      customerName,
      dob,
      email,
      mobile,
      pan,
      adhar,
      drivingLicence,
      gst,
      address,
      pincode,
      city,
      state,
      authorisedPersonName,
      authorisedPersonContact,
      authorisedPersonEmail
    } = body;

    // Generate unique ID
    const lastCustomer = await CustomerRegistrationModel.findOne().sort({ createdAt: -1 });
    let nextId = "CUST001";
    if (lastCustomer && lastCustomer.customerId) {
      const lastNum = parseInt(lastCustomer.customerId.replace("CUST", ""));
      if (!isNaN(lastNum)) {
        nextId = `CUST${String(lastNum + 1).padStart(3, "0")}`;
      }
    }

    const customer = new CustomerRegistrationModel({
      customerType: clientType || "retail",
      customerId: nextId,
      name: customerName,
      dob,
      email,
      mobile,
      panNo: pan,
      aadharNo: adhar,
      drivingLicenseNo: drivingLicence,
      gstNo: gst,
      address,
      pincode,
      city,
      state,
      authorisedPersonName,
      authorisedPersonContact,
      authorisedPersonEmail,
      doj: new Date()
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        _id: customer._id,
        customerName: customer.name,
        clientType: customer.customerType,
        mobile: customer.mobile,
        city: customer.city
      },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: error.message,
    });
  }
};

// ✅ GET ALL
exports.getCustomers = async (req, res) => {
  try {
    const registrations = await CustomerRegistrationModel.find()
      .populate("customerGroupName")
      .sort({ createdAt: -1 });

    const data = registrations.map((item) => ({
      _id: item._id,
      customerName: item.name,
      clientType: item.customerType || "retail",
      mobile: item.mobile,
      city: item.city,
      dob: item.dob,
      email: item.email,
      pan: item.panNo,
      adhar: item.aadharNo,
      drivingLicence: item.drivingLicenseNo,
      gst: item.gstNo,
      address: item.address,
      pincode: item.pincode,
      state: item.state,
      authorisedPersonName: item.authorisedPersonName,
      authorisedPersonContact: item.authorisedPersonContact,
      authorisedPersonEmail: item.authorisedPersonEmail,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching data",
    });
  }
};

// ✅ DELETE
exports.deleteCustomer = async (req, res) => {
  try {
    await CustomerRegistrationModel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete error",
    });
  }
};

// ✅ UPDATE
exports.updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const body = req.body;

    const {
      clientType,
      customerName,
      dob,
      email,
      mobile,
      pan,
      adhar,
      drivingLicence,
      gst,
      address,
      pincode,
      city,
      state,
      authorisedPersonName,
      authorisedPersonContact,
      authorisedPersonEmail
    } = body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID format" });
    }

    const updateFields = {
      customerType: clientType,
      name: customerName,
      dob,
      email,
      mobile,
      panNo: pan,
      aadharNo: adhar,
      drivingLicenseNo: drivingLicence,
      gstNo: gst,
      address,
      pincode,
      city,
      state,
      authorisedPersonName,
      authorisedPersonContact,
      authorisedPersonEmail
    };

    // Filter out undefined fields
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    const updated = await CustomerRegistrationModel.findByIdAndUpdate(
      customerId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: {
        _id: updated._id,
        customerName: updated.name,
        clientType: updated.customerType,
        mobile: updated.mobile,
        city: updated.city
      }
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message
    });
  }
};
