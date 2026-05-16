const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    clientType: {
      type: String,
      enum: ["corporate", "retail"],
      required: true,
    },

    customerId: {
      type: String,
    },

    title: String,

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    dob: Date,

    email: String,

    mobile: String,

    pan: String,

    adhar: String,

    drivingLicence: String,

    gst: String,

    address: String,

    pincode: String,

    city: String,

    state: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);