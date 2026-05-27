const router = require("express").Router();

const {
  createReminder,
  getAllReminders,
  getReminderById,
  getRemindersByPolicy,
  getRemindersByDateRange,
  getExpiringPoliciesWithoutReminder,
  getRemindersByCustomerName,
  updateReminder,
  deleteReminder,
  autoCreateReminders,
  deleteAllReminders,
} = require("../controllers/renewalReminder.controller");

// ================= CREATE REMINDER =================
router.post("/", createReminder);

// ================= AUTO CREATE REMINDERS =================
router.post("/auto-create", autoCreateReminders);

// ================= GET ALL REMINDERS =================
router.get("/", getAllReminders);

// ================= GET REMINDER BY ID =================
router.get("/:id", getReminderById);

// ================= GET REMINDERS BY DATE RANGE =================
router.get("/date-range", getRemindersByDateRange);

// ================= GET REMINDERS BY POLICY =================
router.get("/policy/:policyId", getRemindersByPolicy);

// ================= GET EXPIRING POLICIES WITHOUT REMINDER =================
router.get("/expiring-policies", getExpiringPoliciesWithoutReminder);

// ================= GET REMINDERS BY CUSTOMER NAME =================
router.get("/customer/search", getRemindersByCustomerName);

// ================= UPDATE REMINDER =================
router.put("/:id", updateReminder);

// ================= DELETE REMINDER =================
router.delete("/:id", deleteReminder);

// ================= DELETE ALL REMINDERS =================
router.delete("/", deleteAllReminders);

module.exports = router;