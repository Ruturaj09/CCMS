const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { letterUpload } = require('../middleware/upload');

router.use(requireAuth, requireRole('admin', 'mla'));

// SRS Section 6
router.get('/complaints', adminController.listComplaints);                              // GET /api/v1/admin/complaints
router.patch('/complaints/:id/action', letterUpload.single('letterPdf'), adminController.updateComplaint); // PATCH /api/v1/admin/complaints/{id}/action

// Extra: worker verification (Module 1.3) - list + toggle, for the Android app
router.get('/workers', adminController.workerListJson);
router.patch('/workers/:id/verify', adminController.verifyWorker);

module.exports = router;
