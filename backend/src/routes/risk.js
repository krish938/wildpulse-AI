const express = require('express');
const router = express.Router();
const { getRisk, postRisk } = require('../controllers/riskController');
const { validateRiskQuery } = require('../middleware/validate');

// GET  /api/risk?latitude=...&longitude=... (convenient for browser/testing)
router.get('/', validateRiskQuery, getRisk);

// POST /api/risk  body: { latitude, longitude }
router.post('/', validateRiskQuery, postRisk);

module.exports = router;
