const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('worker', 'sarpanch'));

router.get('/new', complaintController.newComplaintForm);   // GET /complaints/new
router.get('/:id', complaintController.complaintDetail);    // GET /complaints/:id (isolated to owner)

module.exports = router;
