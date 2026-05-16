const Customer = require("../models/Customer");

// ✅ CREATE
exports.createCustomer = async (req, res) => {
  try {
    const body = req.body;

    // 🔥 Auto Customer ID
    body.customerId = "CUST" + Date.now();

    // 🔥 Corporate validation
    if (body.clientType === "corporate" && !body.gst) {
      return res.status(400).json({
        success: false,
        message: "GST is required for corporate clients",
      });
    }

    const customer = new Customer(body);
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
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
    const data = await Customer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching data",
    });
  }
};

// ✅ DELETE
exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);

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