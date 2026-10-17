const mongoose = require('mongoose');

// VILLAGES MASTER TABLE (equivalent to SRS section 5: villages)
const villageSchema = new mongoose.Schema({
  villageName: { type: String, required: true, trim: true },
  talukaName: { type: String, default: 'Akole' },
  // Short code used for ticket numbers, e.g. Sangvi -> SNG
  code: { type: String, required: true, uppercase: true, trim: true, maxlength: 4 }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

villageSchema.index({ villageName: 1 }, { unique: true });

module.exports = mongoose.model('Village', villageSchema);
