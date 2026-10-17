const mongoose = require('mongoose');

// USERS TABLE (SRS section 5) - workers, sarpanchs, admins, MLA
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
  whatsappNumber: { type: String, trim: true },
  designation: { type: String, trim: true },
  role: {
    type: String,
    enum: ['worker', 'sarpanch', 'admin', 'mla'],
    default: 'worker'
  },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: function () {
    // Admin / MLA are not tied to a single village; workers/sarpanch must be.
    return this.role === 'worker' || this.role === 'sarpanch';
  } },
  isVerified: { type: Boolean, default: false }, // party membership verification toggle (module 1.3)
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
