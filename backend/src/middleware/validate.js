/**
 * middleware/validate.js
 * Reusable request-validation middleware factory.
 *
 * Usage:
 *   const { validateBody, validateId } = require('../middleware/validate');
 *
 *   router.post('/', validateBody(rules), controller);
 *   router.get('/:id', validateId, controller);
 *
 * This keeps validation logic out of controllers, making controllers
 * focus solely on business logic.
 */

const mongoose = require('mongoose');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if a value is a finite number within an optional [min, max] range.
 * Handles both string-encoded numbers and actual numbers.
 */
const isNumericInRange = (value, min = -Infinity, max = Infinity) => {
  const n = Number(value);
  return !isNaN(n) && isFinite(n) && n >= min && n <= max;
};

/**
 * Check if a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Middleware Factories ─────────────────────────────────────────────────────

/**
 * validateId
 * Middleware that validates `:id` route parameters as MongoDB ObjectIds.
 * Responds with 400 before the controller runs if the id is malformed.
 */
const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format. Expected a 24-character MongoDB ObjectId.',
    });
  }

  next();
};

/**
 * validateCreateReport
 * Validates the request body for POST /api/reports.
 *
 * Required fields:
 *   - latitude   (number, -90 to 90)
 *   - longitude  (number, -180 to 180)
 *   - description (string, 10–2000 chars)
 *   - severity   ('low' | 'moderate' | 'high' | 'extreme')
 *
 * Optional fields:
 *   - placeName, imageUrl, reporterName, reporterEmail
 */
const validateCreateReport = (req, res, next) => {
  const errors = [];

  const { latitude, longitude, description, severity, reporterEmail } = req.body;

  // Validate latitude
  if (latitude === undefined || latitude === null || latitude === '') {
    errors.push('latitude is required.');
  } else if (!isNumericInRange(latitude, -90, 90)) {
    errors.push('latitude must be a number between -90 and 90.');
  }

  // Validate longitude
  if (longitude === undefined || longitude === null || longitude === '') {
    errors.push('longitude is required.');
  } else if (!isNumericInRange(longitude, -180, 180)) {
    errors.push('longitude must be a number between -180 and 180.');
  }

  // Validate description
  if (!description || typeof description !== 'string') {
    errors.push('description is required and must be a string.');
  } else if (description.trim().length < 10) {
    errors.push('description must be at least 10 characters.');
  } else if (description.trim().length > 2000) {
    errors.push('description must not exceed 2000 characters.');
  }

  // Validate severity
  const validSeverities = ['low', 'moderate', 'high', 'extreme'];
  if (!severity) {
    errors.push('severity is required.');
  } else if (!validSeverities.includes(severity)) {
    errors.push(`severity must be one of: ${validSeverities.join(', ')}.`);
  }

  // Validate optional reporter email if provided
  if (reporterEmail) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(reporterEmail)) {
      errors.push('reporterEmail must be a valid email address.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
};

/**
 * validateUpdateReport
 * Validates the request body for PATCH /api/reports/:id.
 *
 * Ensures at least one allowed field is present and that values are valid.
 * Allowed fields: status, description, severity, imageUrl
 */
const validateUpdateReport = (req, res, next) => {
  const errors = [];
  const allowed = ['status', 'description', 'severity', 'imageUrl'];
  const body = req.body;

  // Check that at least one allowed field is present
  const hasAllowedField = allowed.some((f) => body[f] !== undefined);
  if (!hasAllowedField) {
    return res.status(400).json({
      success: false,
      error: `No valid fields provided. Allowed update fields: ${allowed.join(', ')}.`,
    });
  }

  // Validate status if provided
  const validStatuses = ['pending', 'verified', 'rejected', 'resolved'];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}.`);
  }

  // Validate severity if provided
  const validSeverities = ['low', 'moderate', 'high', 'extreme'];
  if (body.severity !== undefined && !validSeverities.includes(body.severity)) {
    errors.push(`severity must be one of: ${validSeverities.join(', ')}.`);
  }

  // Validate description length if provided
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push('description must be a string.');
    } else if (body.description.trim().length < 10) {
      errors.push('description must be at least 10 characters.');
    } else if (body.description.trim().length > 2000) {
      errors.push('description must not exceed 2000 characters.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
};

/**
 * validateRiskQuery
 * Validates latitude/longitude for GET /api/risk or POST /api/risk.
 * Checks both query params (GET) and request body (POST).
 */
const validateRiskQuery = (req, res, next) => {
  const lat = req.query.latitude ?? req.body?.latitude;
  const lon = req.query.longitude ?? req.body?.longitude;

  if (lat === undefined || lat === null || lat === '') {
    return res.status(400).json({
      success: false,
      error: 'latitude is required.',
      example: 'GET /api/risk?latitude=12.97&longitude=77.59',
    });
  }

  if (lon === undefined || lon === null || lon === '') {
    return res.status(400).json({
      success: false,
      error: 'longitude is required.',
      example: 'GET /api/risk?latitude=12.97&longitude=77.59',
    });
  }

  if (!isNumericInRange(lat, -90, 90)) {
    return res.status(400).json({
      success: false,
      error: 'latitude must be a number between -90 and 90.',
    });
  }

  if (!isNumericInRange(lon, -180, 180)) {
    return res.status(400).json({
      success: false,
      error: 'longitude must be a number between -180 and 180.',
    });
  }

  next();
};

module.exports = {
  validateId,
  validateCreateReport,
  validateUpdateReport,
  validateRiskQuery,
};
