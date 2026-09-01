/**
 * controllers/weatherController.js
 * Handles GET /api/weather?latitude=...&longitude=...
 *
 * Data Flow:
 * GET /api/weather?latitude=12.97&longitude=77.59
 *   → validate query params
 *   → weatherService.getCurrentWeather(lat, lon)
 *   → Open-Meteo /v1/forecast (no API key)
 *   → normalized JSON response
 *
 * Response shape (success):
 * {
 *   success: true,
 *   data: {
 *     latitude, longitude, timezone,
 *     temperature,    // °C
 *     feelsLike,      // °C
 *     humidity,       // %
 *     windSpeed,      // km/h
 *     windDirection,  // degrees
 *     precipitation,  // mm
 *     weatherCode,    // WMO code
 *     weatherDescription,
 *     weatherCategory,
 *     timestamp,      // ISO 8601 (local timezone)
 *   },
 *   dataSource: 'Open-Meteo',
 * }
 *
 * Response shape (error):
 * {
 *   success: false,
 *   error: string,
 *   dataSource: 'Open-Meteo',
 * }
 */

const { getCurrentWeather } = require('../services/weatherService');

/**
 * GET /api/weather
 *
 * Required query params:
 *   latitude  — decimal degrees, -90 to 90
 *   longitude — decimal degrees, -180 to 180
 */
const getWeather = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    // ── Guard: missing params ─────────────────────────────────────────────────
    if (latitude === undefined || latitude === null || latitude === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: latitude.',
        example: '/api/weather?latitude=12.97&longitude=77.59',
        dataSource: 'Open-Meteo',
      });
    }
    if (longitude === undefined || longitude === null || longitude === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: longitude.',
        example: '/api/weather?latitude=12.97&longitude=77.59',
        dataSource: 'Open-Meteo',
      });
    }

    // ── Parse to numbers ──────────────────────────────────────────────────────
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude must be valid decimal numbers.',
        example: '/api/weather?latitude=12.9716&longitude=77.5946',
        dataSource: 'Open-Meteo',
      });
    }

    // ── Range validation ──────────────────────────────────────────────────────
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: `latitude must be between -90 and 90. Got: ${lat}`,
        dataSource: 'Open-Meteo',
      });
    }
    if (lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        error: `longitude must be between -180 and 180. Got: ${lon}`,
        dataSource: 'Open-Meteo',
      });
    }

    // ── Fetch from Open-Meteo ─────────────────────────────────────────────────
    const result = await getCurrentWeather(lat, lon);

    if (!result.success) {
      // Use 400 for validation errors (e.g. Open-Meteo rejects the coordinates),
      // 502 for upstream/network errors.
      const status = result.errorType === 'validation' ? 400 : 502;
      return res.status(status).json({
        success: false,
        error: result.error,
        dataSource: 'Open-Meteo',
      });
    }

    res.json({
      success: true,
      data: result.data,
      dataSource: 'Open-Meteo',   // Attribution for the frontend
      attribution: 'Weather data provided by Open-Meteo (open-meteo.com) — free & open-source',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather };
