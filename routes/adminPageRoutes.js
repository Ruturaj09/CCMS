const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin', 'mla'));

router.get('/dashboard', adminController.dashboard);            // GET /admin/dashboard
router.get('/complaints/:id', adminController.complaintDetail); // GET /admin/complaints/:id
router.get('/workers', adminController.workerList);             // GET /admin/workers
router.get('/export', adminController.exportCsv);               // GET /admin/export

module.exports = router;
