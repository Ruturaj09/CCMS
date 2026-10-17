const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// SRS Section 6: RESTful API Endpoints
router.post('/send-otp', authController.sendOtp);       // POST /api/v1/auth/send-otp
router.post('/verify-otp', authController.verifyOtp);   // POST /api/v1/auth/verify-otp
router.post('/register', authController.register);      // profile linking after OTP (Module 1.2)
router.get('/me', requireAuth, authController.me);      // session restore for the Android app

module.exports = router;
