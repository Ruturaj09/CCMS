const mongoose = require('mongoose');

// Short-lived OTP codes for mobile number verification (Module 1.1)
const otpSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, trim: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  consumed: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-delete expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
