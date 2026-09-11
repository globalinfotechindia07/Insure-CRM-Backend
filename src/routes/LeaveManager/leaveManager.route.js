const express = require("express");
const leaveManagerRouter = express.Router();
const { leaveManagerController } = require("../../controllers/index");
const { handleToken } = require("../../utils/handleToken");

leaveManagerRouter.get("/", handleToken, leaveManagerController.getLeaveManagerController);
leaveManagerRouter.post("/", handleToken, leaveManagerController.postLeaveManagerController);
leaveManagerRouter.put("/:id", handleToken, leaveManagerController.putLeaveManagerController);
leaveManagerRouter.delete("/delete/:id", handleToken, leaveManagerController.deleteLeaveManagerController);
leaveManagerRouter.put("/update-status/:id", handleToken, leaveManagerController.updateStatusController);
leaveManagerRouter.get("/leave-count/:staffName/:leaveTypeName", handleToken, leaveManagerController.getLeaveCountController);

module.exports = leaveManagerRouter;
