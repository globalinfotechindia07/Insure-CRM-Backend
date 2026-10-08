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
    let brokerageRates = await brokerageRateModel.find(query).sort({ brokerageRate: 1 });
    // Auto-seed logic removed: user wants to be able to delete everything and keep it empty
    if (!brokerageRates) {
      brokerageRates = [];
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
    
    // Automatically link unlinked policies to this new rate
    try {
      const numRate = Number(brokerageRate);
      const newId = newbrokerageRate._id;
      const { policyDetailsModel } = require("../../../models/index");

      if (policyDetailsModel) {
        const queryObj = { $or: [ { unlinkedTpBrokerageRate: numRate }, { unlinkedOdBrokerageRate: numRate }, { unlinkedRateOnTerr: numRate }, { unlinkedRateOnOtherTerr: numRate } ] }; if (companyId) { queryObj.insCompany = new mongoose.Types.ObjectId(companyId); } const policiesToUpdate = await policyDetailsModel.find(queryObj); /*
            { unlinkedTpBrokerageRate: numRate },
            { unlinkedOdBrokerageRate: numRate },
            { unlinkedRateOnTerr: numRate },
            { unlinkedRateOnOtherTerr: numRate }
 */ for (const policy of policiesToUpdate) {
          let updated = false;

          if (policy.unlinkedTpBrokerageRate === numRate) {
            policy.tpBrokerageRate = newId;
            policy.unlinkedTpBrokerageRate = undefined;
            if (policy.tpPremium && !isNaN(policy.tpPremium)) {
              policy.tpBrokerageAmount = Math.round(((policy.tpPremium * numRate) / 100) * 100) / 100;
            }
            updated = true;
          }

          if (policy.unlinkedOdBrokerageRate === numRate) {
            policy.odBrokerageRate = newId;
            policy.unlinkedOdBrokerageRate = undefined;
            const basePremium = policy.odPremium || policy.netPremium || 0;
            if (basePremium && !isNaN(basePremium)) {
              policy.odBrokerageAmount = Math.round(((basePremium * numRate) / 100) * 100) / 100;
            }
            updated = true;
          }

          if (policy.unlinkedRateOnTerr === numRate) {
            policy.rateOnTerr = newId;
            policy.unlinkedRateOnTerr = undefined;
            updated = true;
          }

          if (policy.unlinkedRateOnOtherTerr === numRate) {
            policy.rateOnOtherTerr = newId;
            policy.unlinkedRateOnOtherTerr = undefined;
            updated = true;
          }

          if (updated) { const tot = (policy.odBrokerageAmount || 0) + (policy.tpBrokerageAmount || 0); policy.totalBrokerageAmount = tot; const gstInc = policy.totalBrokerageGst || 18; policy.totalBrokerageAmountincGst = Math.round((tot * (1 + (gstInc / 100))) * 100) / 100; const updateQuery = { $set: {}, $unset: {} }; if (policy.tpBrokerageRate) updateQuery.$set.tpBrokerageRate = policy.tpBrokerageRate; if (policy.odBrokerageRate) updateQuery.$set.odBrokerageRate = policy.odBrokerageRate; if (policy.rateOnTerr) updateQuery.$set.rateOnTerr = policy.rateOnTerr; if (policy.rateOnOtherTerr) updateQuery.$set.rateOnOtherTerr = policy.rateOnOtherTerr; if (policy.tpBrokerageAmount !== undefined) updateQuery.$set.tpBrokerageAmount = policy.tpBrokerageAmount; if (policy.odBrokerageAmount !== undefined) updateQuery.$set.odBrokerageAmount = policy.odBrokerageAmount; updateQuery.$set.totalBrokerageAmount = policy.totalBrokerageAmount; updateQuery.$set.totalBrokerageAmountincGst = policy.totalBrokerageAmountincGst; if (policy.unlinkedTpBrokerageRate === undefined) updateQuery.$unset.unlinkedTpBrokerageRate = 1; if (policy.unlinkedOdBrokerageRate === undefined) updateQuery.$unset.unlinkedOdBrokerageRate = 1; if (policy.unlinkedRateOnTerr === undefined) updateQuery.$unset.unlinkedRateOnTerr = 1; if (policy.unlinkedRateOnOtherTerr === undefined) updateQuery.$unset.unlinkedRateOnOtherTerr = 1; if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset; await policyDetailsModel.updateOne({ _id: policy._id }, updateQuery); }
        }
        console.log(`Successfully linked unlinked policies for brokerage rate: ${numRate}`);
      }
    } catch (linkErr) {
      console.error('Error linking unlinked brokerage rates:', linkErr);
    }

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



