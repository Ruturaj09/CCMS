const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { complaintFieldsUpload } = require('../middleware/upload');

router.use(requireAuth, requireRole('worker', 'sarpanch'));

// SRS Section 6
router.post('/create', complaintFieldsUpload, complaintController.createComplaint); // POST /api/v1/complaints/create
router.get('/my-history', complaintController.myHistory);                           // GET /api/v1/complaints/my-history

module.exports = router;
