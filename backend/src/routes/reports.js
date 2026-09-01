const express = require('express');
const router = express.Router();
const {
  getReports,
  createReport,
  getReportById,
  updateReport,
} = require('../controllers/reportsController');
const {
  validateId,
  validateCreateReport,
  validateUpdateReport,
} = require('../middleware/validate');

// GET    /api/reports         — list all reports
router.get('/', getReports);

// POST   /api/reports         — validate body, then create
router.post('/', validateCreateReport, createReport);

// GET    /api/reports/:id     — validate ObjectId, then fetch
router.get('/:id', validateId, getReportById);

// PATCH  /api/reports/:id     — validate ObjectId + body, then update
router.patch('/:id', validateId, validateUpdateReport, updateReport);

module.exports = router;
