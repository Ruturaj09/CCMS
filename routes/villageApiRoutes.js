const express = require('express');
const router = express.Router();
const Village = require('../models/Village');

// GET /api/v1/villages - public read-only list, used by the Android app's
// registration screen and admin filter dropdowns (no auth required: it is
// non-sensitive master data, same list already rendered server-side in EJS).
router.get('/', async (req, res) => {
  try {
    const villages = await Village.find().sort({ villageName: 1 });
    res.json({ villages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load villages.' });
  }
});

module.exports = router;
