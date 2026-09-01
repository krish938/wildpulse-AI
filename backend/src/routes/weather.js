const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');

// GET /api/weather?latitude=...&longitude=...
router.get('/', getWeather);

module.exports = router;
