const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const complaintController = require('../controllers/complaintController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect('/login'));

router.get('/login', authController.showLogin);
router.get('/register', authController.showRegister);
router.get('/logout', authController.logout);

// Worker dashboard (own history only - isolation enforced in controller)
router.get('/dashboard', requireAuth, requireRole('worker', 'sarpanch'), complaintController.workerDashboard);

module.exports = router;
