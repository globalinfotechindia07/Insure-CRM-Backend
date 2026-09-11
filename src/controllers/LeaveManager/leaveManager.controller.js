const { leaveManagerModel } = require("../../models/index");

const getLeaveManagerController = async (req, res) => {
  try {
    const data = await leaveManagerModel
      .find({})
      .populate("leaveType")
      .sort({ createdAt: -1 });
    res.status(200).json({ status: "true", data });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const postLeaveManagerController = async (req, res) => {
  try {
    const leaveData = req.body;
    
    // Ignore hr-setup AddLeaveManager if sent here by accident (it sends {inputData: ...})
    if (leaveData.inputData) {
      return res.status(200).json({ status: true, message: "Added successfully from hr-setup" });
    }

    const newLeave = new leaveManagerModel(leaveData);
    await newLeave.save();
    res.status(201).json({ status: "true", message: "Leave applied successfully", data: newLeave });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const putLeaveManagerController = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveData = req.body;
    
    // Ignore hr-setup EditLeaveManager
    if (leaveData.inputData) {
      return res.status(200).json({ status: true, message: "Updated successfully from hr-setup" });
    }

    const updated = await leaveManagerModel.findByIdAndUpdate(id, leaveData, { new: true });
    if (!updated) {
      return res.status(404).json({ status: "false", message: "Not found" });
    }
    res.status(200).json({ status: "true", message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const deleteLeaveManagerController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await leaveManagerModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ status: "false", message: "Not found" });
    }
    res.status(200).json({ status: "true", message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const updateStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;
    const updated = await leaveManagerModel.findByIdAndUpdate(
      id,
      { status, rejectReason },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ status: "false", message: "Not found" });
    }
    res.status(200).json({ status: "true", message: "Status updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ status: "false", message: error.message });
  }
};

const getLeaveCountController = async (req, res) => {
  try {
    const { staffName, leaveTypeName } = req.params;
    
    // Find all approved/applied leaves for this staff and leave type
    // Since we only have ObjectId in leaveType, we might have to lookup.
    // Alternatively, just count based on populated leaveType
    const leaves = await leaveManagerModel.find({ staffName, status: { $in: ['Applied', 'Approved'] } }).populate('leaveType');
    
    let totalTaken = 0;
    for (let leave of leaves) {
      if (leave.leaveType && leave.leaveType.leaveType === leaveTypeName) {
        totalTaken += leave.noOfDays || 0;
      }
    }
    
    res.status(200).json({ success: true, totalLeavesTaken: totalTaken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeaveManagerController,
  postLeaveManagerController,
  putLeaveManagerController,
  deleteLeaveManagerController,
  updateStatusController,
  getLeaveCountController
};
