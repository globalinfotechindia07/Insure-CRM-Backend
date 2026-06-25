const { PaymentModeModel } = require('../../models');
const httpStatus = require("http-status");

const addPaymentMode = async (req, res) => {
    try {
        const { paymentMode } = req.body;
        if (!paymentMode) {
            return res.status(httpStatus.BAD_REQUEST).json({ msg: "Payment Mode is required" });
        }
        const existingMode = await PaymentModeModel.findOne({
            paymentMode: { $regex: new RegExp(`^${paymentMode.trim()}$`, "i") }
        });
        if (existingMode) {
            return res.status(httpStatus.BAD_REQUEST).json({ msg: "Payment Mode already exists" });
        }
        const createdPaymentMode = await PaymentModeModel.create(req.body);
        return res.status(httpStatus.CREATED).json({msg: "Payment Mode Added Successfully", paymentMode: createdPaymentMode});
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({msg: "Error adding Payment Mode", error: error.message});
    }
};

const getPaymentMode = async (req, res) => {
    try {
        const paymentMode = await PaymentModeModel.find();
        return res.status(httpStatus.OK).json({msg: "Payment Mode List", paymentMode});
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({msg: "Payment Mode Not Found", error});
    }
};


const getPaymentModeById = async (req, res) => {
    try {
        const paymentMode = await PaymentModeModel.findById(req.params.id);
        return res.status(httpStatus.OK).json({msg: "Payment Mode List", paymentMode});
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({msg: "Payment Mode Not Found", error});
    }
};

const updatePaymentMode = async (req, res) => {
    try {
        const paymentMode = await PaymentModeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(httpStatus.OK).json({msg: "Payment Mode Updated Successfully", paymentMode});
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({msg: "Payment Mode Not Found", error});
    }
};

const deletePaymentMode = async (req, res) => {
    try {
        const paymentMode = await PaymentModeModel.findByIdAndDelete(req.params.id);
        return res.status(httpStatus.OK).json({msg: "Payment Mode Deleted Successfully", paymentMode});
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({msg: "Payment Mode Not Found", error});
    }
};

module.exports = {
    addPaymentMode,
    getPaymentMode,
    getPaymentModeById,
    updatePaymentMode,
    deletePaymentMode
};
