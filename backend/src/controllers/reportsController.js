/**
 * controllers/reportsController.js
 * CRUD operations for community wildfire reports.
 *
 * Routes:
 *   GET    /api/reports        — list reports (with status filter + pagination)
 *   POST   /api/reports        — submit a new report
 *   GET    /api/reports/:id    — single report by MongoDB ID
 *   PATCH  /api/reports/:id    — update status / description / severity
 *
 * MongoDB is required for persistence. If the DB is unavailable the router
 * still returns a clear error rather than crashing the server.
 */

const FireReport = require('../models/FireReport');

// ─── Utility: check if Mongoose is connected ─────────────────────────────────
const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1; // 1 = connected
};

const dbRequiredError = (res) =>
  res.status(503).json({
    success: false,
    error: 'Database unavailable. Please configure MongoDB Atlas — see setup instructions.',
    help: 'Add your IP to MongoDB Atlas Network Access at cloud.mongodb.com, then restart the server.',
  });

// ─── GET /api/reports ─────────────────────────────────────────────────────────
/**
 * Returns all fire reports, newest first.
 * Query params:
 *   ?status=pending|verified|rejected|resolved  (filter by status)
 *   ?limit=50   (max results, default 50)
 *   ?page=1     (1-indexed page)
 *   ?severity=low|moderate|high|extreme  (filter by severity)
 */
const getReports = async (req, res, next) => {
  if (!isDBConnected()) return dbRequiredError(res);

  try {
    const { status, severity, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      FireReport.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),             // lean() returns plain JS objects — faster for reads
      FireReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/reports ────────────────────────────────────────────────────────
/**
 * Accept a new community fire report and save to MongoDB.
 * Validation is handled by validateCreateReport middleware before this runs.
 */
const createReport = async (req, res, next) => {
  if (!isDBConnected()) return dbRequiredError(res);

  try {
    const {
      latitude,
      longitude,
      placeName,
      description,
      severity,
      imageUrl,
      reporterName,
      reporterEmail,
    } = req.body;

    const report = new FireReport({
      location: {
        latitude:  parseFloat(latitude),
        longitude: parseFloat(longitude),
        placeName: placeName?.trim() || undefined,
      },
      description: description.trim(),
      severity,
      imageUrl: imageUrl || undefined,
      reporter: {
        name:  reporterName?.trim()  || undefined,
        email: reporterEmail?.trim() || undefined,
      },
    });

    await report.save();

    res.status(201).json({
      success: true,
      data: report,
      message: 'Fire report submitted successfully. Thank you for helping protect our forests.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    next(error);
  }
};

// ─── GET /api/reports/:id ─────────────────────────────────────────────────────
const getReportById = async (req, res, next) => {
  if (!isDBConnected()) return dbRequiredError(res);

  try {
    const report = await FireReport.findById(req.params.id).lean();

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid report ID format.' });
    }
    next(error);
  }
};

// ─── PATCH /api/reports/:id ───────────────────────────────────────────────────
/**
 * Update a report's status, description, or severity.
 * Validation handled by validateUpdateReport middleware.
 */
const updateReport = async (req, res, next) => {
  if (!isDBConnected()) return dbRequiredError(res);

  try {
    const allowed = ['status', 'description', 'severity', 'imageUrl'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const report = await FireReport.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }   // return updated doc, run schema validators
    );

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid report ID.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    next(error);
  }
};

module.exports = { getReports, createReport, getReportById, updateReport };
