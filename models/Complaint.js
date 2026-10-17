const mongoose = require('mongoose');

// COMPLAINTS TABLE (SRS section 5) - enforces isolation via user + village references
const complaintSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true }, // e.g. AKL-SNG-2026-089
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true, index: true },

  category: {
    type: String,
    required: true,
    enum: [
      'Roads/Infrastructure',
      'Water Supply',
      'MSEB/Electricity',
      'Health/Hospital',
      'Agriculture/Irrigation',
      'Revenue/Land',
      'Personal Grievance',
      'Education'
    ]
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },

  voiceNoteUrl: { type: String },
  photos: [{ type: String }], // up to 3 image URLs (validated in controller)

  latitude: { type: Number },
  longitude: { type: Number },
  landmark: { type: String, trim: true },

  urgency: { type: String, enum: ['Normal', 'High', 'Emergency'], default: 'Normal' },

  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Letter Issued', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },

  adminPublicRemark: { type: String, trim: true },     // visible to worker
  adminInternalNote: { type: String, trim: true },     // visible only to MLA office
  officialLetterRef: { type: String, trim: true },
  letterPdfUrl: { type: String },

  // Chronological timeline of administrative actions (Module 2.2)
  timeline: [{
    action: String,
    note: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ village: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
