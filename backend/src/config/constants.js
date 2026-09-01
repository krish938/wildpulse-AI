/**
 * config/constants.js
 * Application-wide constants.
 * Central place for configurable values — easy to change without hunting through code.
 */

// ─── Risk Engine Weights ──────────────────────────────────────────────────────
// These weights must sum to 1.0.
// Adjust here to change how much each factor influences the risk score.
const RISK_WEIGHTS = {
  temperature: 0.25,    // Higher temps → drier conditions → more risk
  humidity: 0.20,       // Lower humidity → more risk
  windSpeed: 0.20,      // Higher wind → faster fire spread → more risk
  precipitation: 0.15,  // Recent rain → less risk
  fireActivity: 0.20,   // Nearby active fires → more risk
};

// ─── Risk Thresholds ─────────────────────────────────────────────────────────
const RISK_LEVELS = {
  LOW: { min: 0, max: 25, label: 'LOW', color: '#22c55e' },
  MODERATE: { min: 25, max: 50, label: 'MODERATE', color: '#f59e0b' },
  HIGH: { min: 50, max: 75, label: 'HIGH', color: '#f97316' },
  EXTREME: { min: 75, max: 100, label: 'EXTREME', color: '#ef4444' },
};

// ─── Temperature Thresholds (°C) ─────────────────────────────────────────────
const TEMP_THRESHOLDS = {
  LOW: 20,      // Below this → minimal temp risk
  MODERATE: 30, // 20–30°C → moderate temp risk
  HIGH: 38,     // 30–38°C → high temp risk
  EXTREME: 45,  // Above 38°C → extreme temp risk
};

// ─── Humidity Thresholds (%) ──────────────────────────────────────────────────
const HUMIDITY_THRESHOLDS = {
  EXTREME: 15,   // Below 15% → extreme dryness risk
  HIGH: 30,      // 15–30% → high dryness risk
  MODERATE: 50,  // 30–50% → moderate dryness risk
  LOW: 70,       // Above 70% → low dryness risk (humid)
};

// ─── Wind Speed Thresholds (km/h) ────────────────────────────────────────────
const WIND_THRESHOLDS = {
  LOW: 15,      // Below 15 → minimal wind risk
  MODERATE: 30, // 15–30 → moderate wind risk
  HIGH: 50,     // 30–50 → high wind risk
  EXTREME: 70,  // Above 50 → extreme wind risk
};

// ─── Precipitation Thresholds (mm) ───────────────────────────────────────────
const PRECIP_THRESHOLDS = {
  WET: 5,       // Above 5mm recent rain → significantly less risk
  DAMP: 1,      // 1–5mm → slightly less risk
  DRY: 0,       // No rain → baseline risk
};

// ─── NASA FIRMS Settings ──────────────────────────────────────────────────────
const FIRMS_CONFIG = {
  BASE_URL: 'https://firms.modaps.eosdis.nasa.gov/api',
  // Radius in km to consider "nearby" fires for risk calculation
  NEARBY_FIRE_RADIUS_KM: 50,
  // Confidence threshold to filter low-quality FIRMS detections
  MIN_CONFIDENCE: 'nominal', // 'low', 'nominal', 'high'
};

// ─── Open-Meteo Settings ──────────────────────────────────────────────────────
const WEATHER_CONFIG = {
  BASE_URL: 'https://api.open-meteo.com/v1/forecast',
};

module.exports = {
  RISK_WEIGHTS,
  RISK_LEVELS,
  TEMP_THRESHOLDS,
  HUMIDITY_THRESHOLDS,
  WIND_THRESHOLDS,
  PRECIP_THRESHOLDS,
  FIRMS_CONFIG,
  WEATHER_CONFIG,
};
