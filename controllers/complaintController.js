const Complaint = require('../models/Complaint');
const generateTicketNumber = require('../utils/ticketGenerator');
const { isolationFilter } = require('../middleware/auth');

// GET /dashboard - worker landing page: complaint form + recent history
exports.workerDashboard = async (req, res) => {
  const filter = isolationFilter(req.user); // { user: req.user._id }
  const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(10);
  const stats = await Complaint.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  res.render('worker-dashboard', {
    title: 'My Dashboard',
    complaints,
    stats,
    user: req.user
  });
};

// GET /complaints/new
exports.newComplaintForm = (req, res) => {
  res.render('complaint-new', { title: 'Raise a Complaint', error: null });
};

// POST /api/v1/complaints/create
exports.createComplaint = async (req, res) => {
  try {
    const { category, title, description, latitude, longitude, landmark, urgency } = req.body;

    if (!category || !title) {
      return res.status(400).json({ error: 'Category and title are required.' });
    }

    const villageCode = req.user.village.code;
    const ticketNumber = await generateTicketNumber(villageCode);

    const photos = (req.files && req.files.photos) ? req.files.photos.map(f => `/uploads/photos/${f.filename}`) : [];
    const voiceNoteUrl = (req.files && req.files.voiceNote && req.files.voiceNote[0])
      ? `/uploads/voice/${req.files.voiceNote[0].filename}`
      : undefined;

    const complaint = await Complaint.create({
      ticketNumber,
      user: req.user._id,
      village: req.user.village._id,
      category,
      title,
      description,
      photos,
      voiceNoteUrl,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      landmark,
      urgency: ['Normal', 'High', 'Emergency'].includes(urgency) ? urgency : 'Normal',
      timeline: [{ action: 'Submitted', actor: req.user._id }]
    });

    res.json({ status: 'created', ticketNumber: complaint.ticketNumber, complaintId: complaint._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create complaint.' });
  }
};

// GET /api/v1/complaints/my-history - JSON history (SRS API spec)
exports.myHistory = async (req, res) => {
  const filter = isolationFilter(req.user);
  // Populated the same way listComplaints/dashboard do, so API clients (the
  // Android app) always receive `village`/`user` as objects, never raw ids.
  const complaints = await Complaint.find(filter)
    .populate('village')
    .populate('user', 'fullName mobileNumber whatsappNumber designation role isVerified')
    .sort({ createdAt: -1 });
  res.json({ complaints });
};

// GET /complaints/:id - detail view, STRICTLY isolated to owner (or admin/mla)
exports.complaintDetail = async (req, res) => {
  const filter = { _id: req.params.id, ...isolationFilter(req.user) };
  const complaint = await Complaint.findOne(filter).populate('village').populate('user', 'fullName mobileNumber role');

  if (!complaint) {
    // Either it doesn't exist, or it belongs to another worker -> isolation enforced.
    return res.status(404).render('404', { title: 'Not Found' });
  }

  res.render('complaint-detail', { title: complaint.ticketNumber, complaint, isAdminView: false });
};
