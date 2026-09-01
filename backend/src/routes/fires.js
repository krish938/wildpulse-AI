const express = require('express');
const router = express.Router();
const { getFires } = require('../controllers/firesController');

// GET /api/fires — retrieve NASA FIRMS fire hotspot data
router.get('/', getFires);

module.exports = router;
