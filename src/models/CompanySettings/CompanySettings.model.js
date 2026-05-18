const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String },
  pincode: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
});

const locationSchemaExp = new mongoose.Schema({
  address: { type: String },
  pincode: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  gstNo: { type: String }
});

const companySettingsSchema = new mongoose.Schema({
  companyName: { type: String },
  email: { type: String },
  mobileNumber: { type: String },
  alternateMobileNumber: { type: String },
  websiteLink: { type: String },
  gstNo: { type: String },
  address: { type: String },
  pincode: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  companyLogo: { type: String },
  
  // ✅ FIXED: Changed from ObjectId to String
  refId: { 
    type: String,  // Changed from mongoose.Schema.Types.ObjectId
    ref: 'clientRegistration'
  },

  locations: {
    exportCenter: [locationSchemaExp],
    factories: [locationSchema],
    warehouse: [locationSchema],
    branches: [locationSchema]
  }
}, { timestamps: true });

const companySettingsModel = mongoose.model('companySettings', companySettingsSchema);

module.exports = companySettingsModel;