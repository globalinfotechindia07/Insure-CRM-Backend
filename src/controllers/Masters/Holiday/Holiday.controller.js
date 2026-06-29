const mongoose = require("mongoose");
const holidayModel = require("../../../models/Masters/Holiday/Holiday.model");
const holidayTypeModel = require("../../../models/Masters/HolidayType/HolidayType.model");

// Helper to resolve holidayTypeId from either ObjectId or Name
const resolveHolidayTypeId = async (companyId, value) => {
  if (!value) return null;

  const cleanedVal = String(value).trim();
  if (!cleanedVal) return null;

  // Check if it's a valid mongoose ObjectId
  if (mongoose.Types.ObjectId.isValid(cleanedVal)) {
    return cleanedVal;
  }

  // Treat as name: find or create
  let type = await holidayTypeModel.findOne({
    companyId,
    holidayTypeName: { $regex: new RegExp(`^${cleanedVal}$`, "i") }
  });

  if (!type) {
    type = new holidayTypeModel({
      companyId,
      holidayTypeName: cleanedVal,
      color: "#1976d2", // default color
    });
    await type.save();
  }

  return type._id;
};

// Create Holiday
const createHoliday = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { holidayTypeId, holidayName, date } = req.body;

    if (!companyId || !holidayTypeId || !holidayName || !date) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const resolvedTypeId = await resolveHolidayTypeId(companyId, holidayTypeId);
    if (!resolvedTypeId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid holiday type" });
    }

    const newHoliday = new holidayModel({
      companyId,
      holidayTypeId: resolvedTypeId,
      holidayName,
      date,
    });

    await newHoliday.save();
    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: newHoliday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating holiday",
      error: error.message,
    });
  }
};

// Get all Holidays
const getHolidays = async (req, res) => {
  try {
    const { companyId } = req.query;
    const filter = companyId ? { companyId } : {};

    const holidays = await holidayModel
      .find(filter)
      .populate("holidayTypeId", "holidayTypeName color")
      .sort({ date: 1 });

    res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching holidays",
      error: error.message,
    });
  }
};

// Get single Holiday by ID
const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await holidayModel
      .findById(id)
      .populate("holidayTypeId", "holidayTypeName color");

    if (!holiday) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching holiday",
      error: error.message,
    });
  }
};

// Update Holiday
const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    const { holidayTypeId, holidayName, date } = req.body;

    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
      const existingHoliday = await holidayModel.findById(id);
      if (existingHoliday) {
        resolvedCompanyId = existingHoliday.companyId;
      }
    }

    if (!resolvedCompanyId) {
      return res.status(400).json({ success: false, message: "Company ID is required" });
    }

    const resolvedTypeId = await resolveHolidayTypeId(resolvedCompanyId, holidayTypeId);
    if (!resolvedTypeId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid holiday type" });
    }

    const updatedHoliday = await holidayModel.findByIdAndUpdate(
      id,
      { holidayTypeId: resolvedTypeId, holidayName, date },
      { new: true }
    );

    if (!updatedHoliday) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: updatedHoliday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating holiday",
      error: error.message,
    });
  }
};

// Delete Holiday
const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedHoliday = await holidayModel.findByIdAndDelete(id);

    if (!deletedHoliday) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Holiday deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting holiday",
      error: error.message,
    });
  }
};

module.exports = {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};
