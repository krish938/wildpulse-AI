/**
 * controllers/riskController.js
 * Handles wildfire risk prediction requests.
 *
 * Routes:
 *   GET  /api/risk?latitude=...&longitude=...  (convenient for browser testing)
 *   POST /api/risk  body: { latitude, longitude }
 *
 * Flow:
 *   1. Parse + validate coordinates (via validateRiskQuery middleware)
 *   2. Fetch weather from Open-Meteo in parallel with FIRMS hotspots
 *   3. Filter FIRMS hotspots to only those within NEARBY_FIRE_RADIUS_KM
 *   4. Build features object → predictRisk() → full risk result
 *   5. Return structured JSON with weather, risk, fire stats, factor breakdown
 *
 * Response shape:
 * {
 *   success: true,
 *   location: { latitude, longitude },
 *   weather: { ...weatherData } | { error: string },
 *   risk: {
 *     score, level, confidence, explanation,
 *     factors, factorScores, factorBreakdown, fireStats,
 *     modelType, weights
 *   },
 *   nearbyFireCount: number,
 *   nearbyFireRadius: number,   // km
 *   dataSource: { weather, fires }
 * }
 */

const { getCurrentWeather }  = require('../services/weatherService');
const { getFireHotspots }    = require('../services/firmsService');
const { predictRisk }        = require('../services/riskService');
const { FIRMS_CONFIG }       = require('../config/constants');

/**
 * Haversine distance between two lat/lon points.
 * Returns distance in kilometres.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Core handler shared by GET and POST routes.
 * Coordinates have already been validated by validateRiskQuery middleware.
 */
const computeRisk = async (req, res, next) => {
  try {
    const latitude  = parseFloat(req.query.latitude  ?? req.body?.latitude);
    const longitude = parseFloat(req.query.longitude ?? req.body?.longitude);

    // Fetch weather and FIRMS data concurrently for speed
    const [weatherResult, firmsResult] = await Promise.allSettled([
      getCurrentWeather(latitude, longitude),
      getFireHotspots(),
    ]);

    // ── Weather ────────────────────────────────────────────────────────────────
    const hasWeather = weatherResult.status === 'fulfilled' && weatherResult.value.success;
    const weather    = hasWeather ? weatherResult.value.data : null;

    // ── FIRMS hotspots → filter to nearby ─────────────────────────────────────
    const allFires   = firmsResult.status === 'fulfilled' && firmsResult.value.success
      ? firmsResult.value.data
      : [];

    const radiusKm = FIRMS_CONFIG.NEARBY_FIRE_RADIUS_KM;

    const nearbyFires = allFires.filter((fire) => {
      if (!fire.latitude || !fire.longitude) return false;
      return haversineDistance(latitude, longitude, fire.latitude, fire.longitude) <= radiusKm;
    });

    // ── Risk features ──────────────────────────────────────────────────────────
    // Use real weather values when available; otherwise pass null so the engine
    // uses its configured defaults and flags lower confidence.
    const features = {
      temperature:   weather?.temperature   ?? null,
      humidity:      weather?.humidity      ?? null,
      windSpeed:     weather?.windSpeed     ?? null,
      precipitation: weather?.precipitation ?? null,
      nearbyFires,
      hasWeather,
      radiusKm,
    };

    // ── Run prediction engine ──────────────────────────────────────────────────
    const riskResult = predictRisk(features);

    // ── Build response ─────────────────────────────────────────────────────────
    res.json({
      success: true,
      location: { latitude, longitude },

      // Full normalized weather object from Open-Meteo, or an error note
      weather: hasWeather
        ? weather
        : { error: 'Weather data unavailable — risk calculated using default values.' },

      // Full risk prediction (score, level, factors, breakdown, etc.)
      risk: riskResult,

      // Convenience fields at root level for easy access
      nearbyFireCount:  nearbyFires.length,
      nearbyFireRadius: radiusKm,

      // Attribution for the frontend
      dataSource: {
        weather: 'Open-Meteo (open-meteo.com)',
        fires:   'NASA FIRMS (firms.modaps.eosdis.nasa.gov)',
      },
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getRisk: computeRisk, postRisk: computeRisk };
