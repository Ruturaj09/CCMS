const Complaint = require('../models/Complaint');
const Village = require('../models/Village');
const User = require('../models/User');

// GET /admin/dashboard - master dashboard & analytics (Module 3.1)
exports.dashboard = async (req, res) => {
  const { village, department, status, urgency, from, to, q } = req.query;

  const filter = {};
  if (village) filter.village = village;
  if (department) filter.category = department;
  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  if (q) {
    filter.$or = [
      { ticketNumber: { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } }
    ];
  }

  const [complaints, villages, totalReceived, totalResolved, byVillage, byDept, byStatus, avgResolutionAgg] = await Promise.all([
    Complaint.find(filter).populate('village').populate('user', 'fullName mobileNumber').sort({ createdAt: -1 }).limit(200),
    Village.find().sort({ villageName: 1 }),
    Complaint.countDocuments({}),
    Complaint.countDocuments({ status: 'Resolved' }),
    Complaint.aggregate([{ $group: { _id: '$village', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      { $project: { resolutionDays: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
      { $group: { _id: null, avgDays: { $avg: '$resolutionDays' } } }
    ])
  ]);

  // Map village ids to names for the heat-map summary table
  const villageMap = {};
  villages.forEach(v => { villageMap[v._id] = v.villageName; });
  const villageBreakdown = byVillage
    .map(v => ({ name: villageMap[v._id] || 'Unknown', count: v.count }))
    .sort((a, b) => b.count - a.count);

  const avgResolutionDays = avgResolutionAgg[0] ? avgResolutionAgg[0].avgDays.toFixed(1) : 'N/A';

  const activeFilters = { village, department, status, urgency, from, to, q };
  const filterQueryString = Object.entries(activeFilters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  res.render('admin-dashboard', {
    title: 'MLA Office Admin Dashboard',
    complaints,
    villages,
    filterQueryString,
    filters: activeFilters,
    kpis: {
      totalReceived,
      totalResolved,
      avgResolutionDays
    },
    villageBreakdown,
    byDept,
    byStatus
  });
};

// GET /admin/complaints/:id
exports.complaintDetail = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('village')
    .populate('user', 'fullName mobileNumber whatsappNumber designation isVerified')
    .populate('timeline.actor', 'fullName role');

  if (!complaint) return res.status(404).render('404', { title: 'Not Found' });

  res.render('admin-complaint-detail', { title: complaint.ticketNumber, complaint });
};

// PATCH /api/v1/admin/complaints/:id/action
// Body: { status, adminPublicRemark, adminInternalNote, officialLetterRef }
exports.updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    const { status, adminPublicRemark, adminInternalNote, officialLetterRef } = req.body;
    const validStatuses = ['Submitted', 'Under Review', 'Letter Issued', 'Resolved', 'Rejected'];

    const changes = [];
    if (status && validStatuses.includes(status) && status !== complaint.status) {
      complaint.status = status;
      changes.push(`Status -> ${status}`);
    }
    if (adminPublicRemark !== undefined) {
      complaint.adminPublicRemark = adminPublicRemark;
      changes.push('Public remark updated');
    }
    if (adminInternalNote !== undefined) {
      complaint.adminInternalNote = adminInternalNote;
      changes.push('Internal note updated');
    }
    if (officialLetterRef !== undefined && officialLetterRef !== '') {
      complaint.officialLetterRef = officialLetterRef;
      changes.push(`Letter ref: ${officialLetterRef}`);
    }
    if (req.file) {
      complaint.letterPdfUrl = `/uploads/letters/${req.file.filename}`;
      changes.push('Letter document uploaded');
    }

    if (changes.length) {
      complaint.timeline.push({ action: changes.join('; '), actor: req.user._id });
    }

    await complaint.save();

    // Closed-loop notification (Module 2 workflow step) - simulated as console log,
    // same pluggable pattern as OTP (swap for real SMS/push provider later).
    console.log(`[NOTIFY] SMS/Push to worker re: ${complaint.ticketNumber} -> status: ${complaint.status}`);

    // Re-fetch populated so the JSON response shape matches every other
    // complaint endpoint (village/user as objects, not raw ids) — keeps API
    // clients like the Android app consistent.
    const populated = await Complaint.findById(complaint._id)
      .populate('village')
      .populate('user', 'fullName mobileNumber whatsappNumber designation role isVerified');

    res.json({ status: 'updated', complaint: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update complaint.' });
  }
};

// GET /api/v1/admin/complaints - JSON listing with filters (SRS API spec)
exports.listComplaints = async (req, res) => {
  const { village, department, status } = req.query;
  const filter = {};
  if (village) filter.village = village;
  if (department) filter.category = department;
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter).populate('village').populate('user', 'fullName mobileNumber');
  res.json({ complaints });
};

// GET /admin/workers - simple worker verification list (Module 1.3)
exports.workerList = async (req, res) => {
  const workers = await User.find({ role: { $in: ['worker', 'sarpanch'] } }).populate('village').sort({ createdAt: -1 });
  res.render('admin-workers', { title: 'Worker Verification', workers });
};

// GET /api/v1/admin/workers - JSON version of the above, for the Android app.
exports.workerListJson = async (req, res) => {
  const workers = await User.find({ role: { $in: ['worker', 'sarpanch'] } }).populate('village').sort({ createdAt: -1 });
  res.json({ workers });
};

// PATCH /api/v1/admin/workers/:id/verify
exports.verifyWorker = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ status: 'verified', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify worker.' });
  }
};

// GET /admin/export - CSV export (Module 3.3). CSV is used instead of a binary
// Excel/PDF library to keep the deliverable dependency-free; it opens natively
// in Excel/Sheets and can be swapped for exceljs/pdfkit later if needed.
exports.exportCsv = async (req, res) => {
  const { village, department, status, from, to } = req.query;
  const filter = {};
  if (village) filter.village = village;
  if (department) filter.category = department;
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const complaints = await Complaint.find(filter).populate('village').populate('user', 'fullName mobileNumber');

  const header = ['Ticket Number', 'Village', 'Worker', 'Mobile', 'Category', 'Title', 'Urgency', 'Status', 'Created At'];
  const rows = complaints.map(c => [
    c.ticketNumber,
    c.village ? c.village.villageName : '',
    c.user ? c.user.fullName : '',
    c.user ? c.user.mobileNumber : '',
    c.category,
    `"${(c.title || '').replace(/"/g, '""')}"`,
    c.urgency,
    c.status,
    c.createdAt.toISOString()
  ]);

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="akole_complaints_${Date.now()}.csv"`);
  res.send(csv);
};
