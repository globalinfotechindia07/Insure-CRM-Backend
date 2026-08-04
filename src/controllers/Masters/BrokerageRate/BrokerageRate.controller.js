const { default: mongoose } = require("mongoose");
// const {
//   brokerageRateModel,
// } = require("../../../models/Masters/BrokerageRate/BrokerageRate.model");
const { brokerageRateModel } = require("../../../models/index");

const getBrokerageRateController = async (req, res) => {
  try {
    const { companyId } = req.query;
    const query = {};
    if (companyId && mongoose.Types.ObjectId.isValid(companyId) && companyId !== "68c07ddaeb160d097128c5af") {
      query.$or = [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: companyId },
        { companyId: null },
        { companyId: { $exists: false } }
      ];
    }
    let brokerageRates = await brokerageRateModel.find(query).sort({ createdAt: -1 });
    if (!brokerageRates || brokerageRates.length === 0) {
      const defaultRates = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25];
      const createdDocs = [];
      for (const rate of defaultRates) {
        try {
          const doc = await brokerageRateModel.create({
            brokerageRate: rate,
            companyId: (companyId && mongoose.Types.ObjectId.isValid(companyId)) ? companyId : null
          });
          createdDocs.push(doc);
        } catch (e) {
          // ignore duplicate key errors if concurrent
        }
      }
      brokerageRates = await brokerageRateModel.find({}).sort({ brokerageRate: 1 });
    }
    res.status(200).json({ status: "true", data: brokerageRates || [] });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error fetching brokerage rates", error.message],
    });
  }
};

const postBrokerageRateController = async (req, res) => {
  try {
    const { companyId } = req.query;
    const brokerageRate = req.body.brokerageRate;
    if (!brokerageRate) {
      return res.status(400).json({
        status: "false",
        message: " Brokerage Rate is required",
      });
    }
    const existingRate = await brokerageRateModel.findOne({
      companyId,
      brokerageRate: Number(brokerageRate),
    });
    if (existingRate) {
      return res.status(400).json({
        status: "false",
        message: "Brokerage Rate already exists",
      });
    }
    const newbrokerageRate = new brokerageRateModel({
      brokerageRate: Number(brokerageRate),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    await newbrokerageRate.save();
    res.status(201).json({ status: "true", data: newbrokerageRate });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "false",
      message: ["Error creating  Brokerage Rate", error.message],
    });
  }
};

const putBrokerageRateController = async (req, res) => {
  try {
    const id = req.params.id;
    const { brokerageRate } = req.body;

    const updatedRate = await brokerageRateModel.findByIdAndUpdate(
      id,
      { brokerageRate },
      { new: true, runValidators: true }
    );

    if (!updatedRate) {
      return res
        .status(404)
        .json({ status: "false", message: "Broker Rate not found" });
    }

    res.status(200).json({ status: "true", data: updatedRate });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error Updating Broker Rate", error.message],
    });
  }
};

const deleteBrokerageRateController = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedRate = await brokerageRateModel.findByIdAndDelete(id);

    if (!deletedRate) {
      return res
        .status(404)
        .json({ status: "false", message: "Brokerage Rate not found" });
    }

    res
      .status(200)
      .json({ status: "true", message: "Brokerage Rate deleted Successfully" });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: ["Error deleting Brokerage Rate", error.message],
    });
  }
};

module.exports = {
  getBrokerageRateController,
  postBrokerageRateController,
  putBrokerageRateController,
  deleteBrokerageRateController,
};
