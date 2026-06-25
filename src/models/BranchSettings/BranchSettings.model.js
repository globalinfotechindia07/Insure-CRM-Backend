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

const branchSettingsSchema = new mongoose.Schema({
  // Use alias so branchName maps to companyName in the database
  companyName: { type: String, trim: true, alias: 'branchName' },
  
  email: { type: String, lowercase: true, trim: true },
  mobileNumber: { type: String, trim: true },
  alternateMobileNumber: { type: String, trim: true },
  websiteLink: { type: String, trim: true },
  gstNo: { type: String, uppercase: true, trim: true },
  address: { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, trim: true },
  state: { type: String, trim: true },
  city: { type: String, trim: true },
  
  // Use alias so branchLogo maps to companyLogo in the database
  companyLogo: { 
    type: String,
    default: null,
    trim: true,
    alias: 'branchLogo'
  },
  
  // ✅ refId as String (not ObjectId)
  refId: { 
    type: String,
    ref: 'clientRegistration',
    index: true  // ✅ Add index for faster queries
  },

  locations: {
    exportCenter: [locationSchemaExp],
    factories: [locationSchema],
    warehouse: [locationSchema],
    branches: [locationSchema]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

// ✅ Virtual field for full logo URL
branchSettingsSchema.virtual('logoUrl').get(function() {
  const logo = this.companyLogo;
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  if (logo.startsWith('/uploads')) return logo;
  return `/uploads/company-logo/${logo}`;
});

// ✅ Explicitly target the existing 'companySettings' collection to preserve data
const branchSettingsModel = mongoose.model('branchSettings', branchSettingsSchema, 'companySettings');

module.exports = branchSettingsModel;
