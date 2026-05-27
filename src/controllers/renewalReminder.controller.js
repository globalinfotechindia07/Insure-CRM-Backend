const RenewalReminder = require("../models/renewalReminder.model");
const Policy = require("../models/policy.model");

// ================= CREATE REMINDER =================
exports.createReminder = async (req, res) => {
  try {
    const { policyId, reminderDays = 7 } = req.body;

    // Find policy details
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });
    }

    // Calculate reminder date
    const endDate = new Date(policy.endDate);
    const reminderDate = new Date(endDate);
    reminderDate.setDate(endDate.getDate() - reminderDays);

    // Check if reminder already exists
    const existingReminder = await RenewalReminder.findOne({
      policyId: policyId,
    });

    if (existingReminder) {
      return res.status(400).json({
        success: false,
        message: "Reminder already exists for this policy",
      });
    }

    // Create reminder
    const reminder = await RenewalReminder.create({
      policyId: policyId,
      customerName: policy.insuredName,
      contactNo: policy.contactNo,
      email: policy.email,
      policyNo: policy.policyNo,
      endDate: policy.endDate,
      reminderDate: reminderDate,
      reminderDays: reminderDays,
    });

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL REMINDERS =================
exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await RenewalReminder.find()
      .populate("policyId", "policyNo insuredName premium totalAmount endDate vehicleNumber department")
      .sort({ reminderDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET REMINDER BY ID =================
exports.getReminderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await RenewalReminder.findById(id)
      .populate("policyId", "policyNo insuredName premium totalAmount endDate vehicleNumber department");

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET REMINDERS BY POLICY =================
exports.getRemindersByPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    
    const reminders = await RenewalReminder.find({ policyId })
      .populate("policyId", "policyNo insuredName premium totalAmount endDate vehicleNumber department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET REMINDERS BY DATE RANGE =================
exports.getRemindersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.reminderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const reminders = await RenewalReminder.find(query)
      .populate("policyId", "policyNo insuredName premium totalAmount endDate vehicleNumber department")
      .sort({ reminderDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE REMINDER =================
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await RenewalReminder.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reminder updated successfully",
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE REMINDER =================
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await RenewalReminder.findByIdAndDelete(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= AUTO CREATE REMINDERS FOR EXPIRING POLICIES =================
exports.autoCreateReminders = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // Find policies expiring in next 30 days
    const expiringPolicies = await Policy.find({
      endDate: { $gte: today, $lte: next30Days },
      status: true,
    });

    const createdReminders = [];
    const skippedReminders = [];

    for (const policy of expiringPolicies) {
      // Check if reminder already exists
      const existingReminder = await RenewalReminder.findOne({
        policyId: policy._id,
      });

      if (!existingReminder) {
        const reminderDate = new Date(policy.endDate);
        reminderDate.setDate(policy.endDate.getDate() - 7);

        const reminder = await RenewalReminder.create({
          policyId: policy._id,
          customerName: policy.insuredName,
          contactNo: policy.contactNo,
          email: policy.email,
          policyNo: policy.policyNo,
          endDate: policy.endDate,
          reminderDate: reminderDate,
          reminderDays: 7,
        });
        createdReminders.push(reminder);
      } else {
        skippedReminders.push({
          policyId: policy._id,
          policyNo: policy.policyNo,
          reason: "Reminder already exists",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${createdReminders.length} reminders created successfully, ${skippedReminders.length} skipped`,
      data: {
        created: createdReminders,
        skipped: skippedReminders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET EXPIRING POLICIES (NO REMINDER YET) =================
exports.getExpiringPoliciesWithoutReminder = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // Find policies expiring in next 30 days
    const expiringPolicies = await Policy.find({
      endDate: { $gte: today, $lte: next30Days },
      status: true,
    });

    // Filter out policies that already have reminders
    const policiesWithoutReminder = [];
    for (const policy of expiringPolicies) {
      const existingReminder = await RenewalReminder.findOne({
        policyId: policy._id,
      });
      
      if (!existingReminder) {
        policiesWithoutReminder.push(policy);
      }
    }

    res.status(200).json({
      success: true,
      count: policiesWithoutReminder.length,
      data: policiesWithoutReminder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE ALL REMINDERS =================
exports.deleteAllReminders = async (req, res) => {
  try {
    const result = await RenewalReminder.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} reminders deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET REMINDERS BY CUSTOMER NAME =================
exports.getRemindersByCustomerName = async (req, res) => {
  try {
    const { name } = req.query;
    
    const reminders = await RenewalReminder.find({
      customerName: { $regex: name, $options: "i" },
    })
      .populate("policyId", "policyNo insuredName premium totalAmount endDate vehicleNumber department")
      .sort({ reminderDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};