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
  companyName: { type: String, trim: true },
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
  
  // ✅ Store logo path as string (relative path)
  companyLogo: { 
    type: String,
    default: null,
    trim: true
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual field for full logo URL
companySettingsSchema.virtual('logoUrl').get(function() {
  if (!this.companyLogo) return null;
  if (this.companyLogo.startsWith('http')) return this.companyLogo;
  if (this.companyLogo.startsWith('/uploads')) return this.companyLogo;
  return `/uploads/company-logo/${this.companyLogo}`;
});

const companySettingsModel = mongoose.model('companySettings', companySettingsSchema);

module.exports = companySettingsModel;