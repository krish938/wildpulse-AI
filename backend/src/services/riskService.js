/**
 * services/riskService.js
 * WildPulse AI — Wildfire Risk Prediction Engine
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DISCLAIMER: This is a transparent, configurable scoring model built for
 * educational and demonstration purposes. It is NOT a scientifically
 * validated wildfire forecasting system. Weights and thresholds are
 * reasonable approximations based on known wildfire science but have NOT
 * been validated against real-world event datasets.
 *
 * The architecture is designed to be replaceable: the exported `predictRisk`
 * function has a stable interface, so the internal logic can be swapped for
 * a trained ML model (e.g. Random Forest, XGBoost) without changing callers.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Wildfire risk factors used (with scientific rationale):
 *
 * 1. Temperature    — High temps dry out vegetation and increase ignition probability.
 * 2. Humidity       — Low relative humidity desiccates fine fuel (grass, leaves),
 *                     lowering the energy required to ignite.
 * 3. Wind Speed     — Wind supplies oxygen, increases rate of spread, and lofts embers.
 *                     Critical Red Flag condition: >25 km/h + <15% humidity.
 * 4. Precipitation  — Recent rain increases fuel moisture content; dry streaks
 *                     dramatically raise ignition risk.
 * 5. Nearby Fire Activity (NASA FIRMS)
 *                   — Active hotspots within a radius indicate an already-active
 *                     fire environment. Uses fire COUNT and average FRP
 *                     (Fire Radiative Power in MW). High-confidence detections
 *                     are weighted more than low-confidence ones.
 */

const {
  RISK_WEIGHTS,
  RISK_LEVELS,
  TEMP_THRESHOLDS,
  HUMIDITY_THRESHOLDS,
  WIND_THRESHOLDS,
  PRECIP_THRESHOLDS,
} = require('../config/constants');

// ─── Utility: smooth linear interpolation within a band ──────────────────────
const lerp = (value, low, high, fromScore, toScore) =>
  fromScore + ((value - low) / (high - low)) * (toScore - fromScore);

// ─── Factor Scorers (each returns 0–100) ─────────────────────────────────────

/**
 * Temperature → risk score.
 * Higher temperature = drier vegetation = higher fire risk.
 */
const scoreTemperature = (temp) => {
  if (temp === null || temp === undefined) return 30;
  if (temp >= TEMP_THRESHOLDS.EXTREME) return 100;
  if (temp >= TEMP_THRESHOLDS.HIGH)
    return lerp(temp, TEMP_THRESHOLDS.HIGH, TEMP_THRESHOLDS.EXTREME, 75, 100);
  if (temp >= TEMP_THRESHOLDS.MODERATE)
    return lerp(temp, TEMP_THRESHOLDS.MODERATE, TEMP_THRESHOLDS.HIGH, 40, 75);
  if (temp >= TEMP_THRESHOLDS.LOW)
    return lerp(temp, TEMP_THRESHOLDS.LOW, TEMP_THRESHOLDS.MODERATE, 10, 40);
  return Math.max(0, lerp(temp, -10, TEMP_THRESHOLDS.LOW, 0, 10));
};

/**
 * Humidity → risk score. Inverted: HIGH humidity = LOW score.
 */
const scoreHumidity = (humidity) => {
  if (humidity === null || humidity === undefined) return 40;
  if (humidity <= HUMIDITY_THRESHOLDS.EXTREME) return 100;
  if (humidity <= HUMIDITY_THRESHOLDS.HIGH)
    return lerp(humidity, HUMIDITY_THRESHOLDS.EXTREME, HUMIDITY_THRESHOLDS.HIGH, 100, 70);
  if (humidity <= HUMIDITY_THRESHOLDS.MODERATE)
    return lerp(humidity, HUMIDITY_THRESHOLDS.HIGH, HUMIDITY_THRESHOLDS.MODERATE, 70, 30);
  if (humidity <= HUMIDITY_THRESHOLDS.LOW)
    return lerp(humidity, HUMIDITY_THRESHOLDS.MODERATE, HUMIDITY_THRESHOLDS.LOW, 30, 0);
  return 0;
};

/**
 * Wind speed → risk score.
 * Higher wind = faster fire spread, more oxygen supply, ember lofting.
 */
const scoreWindSpeed = (windSpeed) => {
  if (windSpeed === null || windSpeed === undefined) return 15;
  if (windSpeed >= WIND_THRESHOLDS.EXTREME) return 100;
  if (windSpeed >= WIND_THRESHOLDS.HIGH)
    return lerp(windSpeed, WIND_THRESHOLDS.HIGH, WIND_THRESHOLDS.EXTREME, 70, 100);
  if (windSpeed >= WIND_THRESHOLDS.MODERATE)
    return lerp(windSpeed, WIND_THRESHOLDS.MODERATE, WIND_THRESHOLDS.HIGH, 35, 70);
  if (windSpeed >= WIND_THRESHOLDS.LOW)
    return lerp(windSpeed, WIND_THRESHOLDS.LOW, WIND_THRESHOLDS.MODERATE, 10, 35);
  return Math.max(0, lerp(windSpeed, 0, WIND_THRESHOLDS.LOW, 0, 10));
};

/**
 * Precipitation → risk score.
 * Recent rain raises fuel moisture, strongly reducing ignition risk.
 */
const scorePrecipitation = (precip) => {
  if (precip === null || precip === undefined) return 70;
  if (precip >= PRECIP_THRESHOLDS.WET)  return 0;
  if (precip >= PRECIP_THRESHOLDS.DAMP)
    return lerp(precip, PRECIP_THRESHOLDS.DAMP, PRECIP_THRESHOLDS.WET, 50, 0);
  if (precip > 0)
    return lerp(precip, 0, PRECIP_THRESHOLDS.DAMP, 80, 50);
  return 80;
};

/**
 * Nearby fire activity → risk score using three signals:
 *   1. Fire COUNT   — up to 50 points (capped at 15 fires)
 *   2. Average FRP  — up to 35 points (MW, capped at 300)
 *   3. Confidence   — up to 15 bonus points for nominal/high-confidence fires
 */
const scoreFireActivity = (nearbyFires) => {
  if (!nearbyFires || nearbyFires.length === 0) return 0;

  const count     = nearbyFires.length;
  const countScore = Math.min(count / 15, 1) * 50;

  const totalFRP  = nearbyFires.reduce((sum, f) => sum + (f.frp || 0), 0);
  const avgFRP    = totalFRP / count;
  const frpScore  = Math.min(avgFRP / 300, 1) * 35;

  const highConfCount = nearbyFires.filter((f) =>
    f.confidence === 'high' || f.confidence === 'h' ||
    f.confidence === 'nominal' || f.confidence === 'n'
  ).length;
  const confBonus = (highConfCount / count) * 15;

  return Math.min(Math.round(countScore + frpScore + confBonus), 100);
};

// ─── Risk Level Classifier ────────────────────────────────────────────────────

const getRiskLevel = (score) => {
  if (score >= RISK_LEVELS.EXTREME.min)  return 'EXTREME';
  if (score >= RISK_LEVELS.HIGH.min)     return 'HIGH';
  if (score >= RISK_LEVELS.MODERATE.min) return 'MODERATE';
  return 'LOW';
};

const scoreToLabel = (score) => {
  if (score >= 75) return 'Extreme';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Moderate';
  return 'Low';
};

// ─── Human-readable Explanation Generator ────────────────────────────────────

const generateExplanations = (factorScores, features, fireStats) => {
  const items = [];

  // Temperature
  if (factorScores.temperature >= 75)
    items.push(`High temperature (${features.temperature?.toFixed(1)}°C) significantly dries out vegetation.`);
  else if (factorScores.temperature >= 40)
    items.push(`Elevated temperature (${features.temperature?.toFixed(1)}°C) increases fuel dryness.`);
  else
    items.push(`Temperature (${features.temperature?.toFixed(1)}°C) is within a lower-risk range.`);

  // Humidity
  if (factorScores.humidity >= 70)
    items.push(`Very low humidity (${features.humidity}%) creates critically dry fuel conditions.`);
  else if (factorScores.humidity >= 30)
    items.push(`Low humidity (${features.humidity}%) reduces moisture in fine fuels.`);
  else
    items.push(`Humidity (${features.humidity}%) provides some suppression of fire risk.`);

  // Wind
  if (factorScores.windSpeed >= 70)
    items.push(`Strong winds (${features.windSpeed?.toFixed(1)} km/h) would rapidly spread any fire.`);
  else if (factorScores.windSpeed >= 35)
    items.push(`Moderate winds (${features.windSpeed?.toFixed(1)} km/h) increase potential fire spread.`);
  else
    items.push(`Light winds (${features.windSpeed?.toFixed(1)} km/h) limit fire spread risk.`);

  // Precipitation
  if (factorScores.precipitation === 0)
    items.push(`Recent rainfall (${features.precipitation?.toFixed(1)} mm) has moistened fuels.`);
  else if (factorScores.precipitation <= 50)
    items.push(`Light precipitation slightly reduces fuel dryness.`);
  else
    items.push(`No significant rainfall — dry fuel conditions elevate fire risk.`);

  // Fire activity
  if (fireStats.count === 0)
    items.push(`No active fire hotspots detected within ${features.radiusKm || 50} km.`);
  else if (factorScores.fireActivity >= 50)
    items.push(
      `${fireStats.count} active hotspot${fireStats.count > 1 ? 's' : ''} nearby` +
      (fireStats.avgFRP > 0 ? ` (avg FRP: ${fireStats.avgFRP.toFixed(1)} MW).` : '.')
    );
  else
    items.push(
      `${fireStats.count} nearby hotspot${fireStats.count > 1 ? 's' : ''} detected` +
      (fireStats.avgFRP > 0 ? ` (avg FRP: ${fireStats.avgFRP.toFixed(1)} MW).` : '.')
    );

  return items;
};

// ─── Confidence Calculation ───────────────────────────────────────────────────

const computeConfidence = (hasWeather, nearbyFires) => {
  let confidence = 0.60;
  if (hasWeather) confidence += 0.15;
  if (nearbyFires.length > 0) {
    confidence += 0.10;
    const highConf = nearbyFires.filter(
      (f) => f.confidence === 'high' || f.confidence === 'h' ||
              f.confidence === 'nominal' || f.confidence === 'n'
    ).length;
    if (highConf > 0) confidence += 0.05;
  }
  return Math.min(confidence, 0.90);
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * predictRisk(features) → risk result object
 *
 * @param {Object}  features
 * @param {number}  features.temperature
 * @param {number}  features.humidity
 * @param {number}  features.windSpeed
 * @param {number}  features.precipitation
 * @param {Array}   features.nearbyFires
 * @param {boolean} features.hasWeather
 * @param {number}  features.radiusKm
 */
const predictRisk = (features) => {
  const {
    temperature   = null,
    humidity      = null,
    windSpeed     = null,
    precipitation = null,
    nearbyFires   = [],
    hasWeather    = true,
    radiusKm      = 50,
  } = features;

  // Step 1: Score each factor independently
  const factorScores = {
    temperature:   Math.round(scoreTemperature(temperature)),
    humidity:      Math.round(scoreHumidity(humidity)),
    windSpeed:     Math.round(scoreWindSpeed(windSpeed)),
    precipitation: Math.round(scorePrecipitation(precipitation)),
    fireActivity:  Math.round(scoreFireActivity(nearbyFires)),
  };

  // Step 2: Weighted average → overall score
  const raw =
    factorScores.temperature   * RISK_WEIGHTS.temperature   +
    factorScores.humidity      * RISK_WEIGHTS.humidity      +
    factorScores.windSpeed     * RISK_WEIGHTS.windSpeed     +
    factorScores.precipitation * RISK_WEIGHTS.precipitation +
    factorScores.fireActivity  * RISK_WEIGHTS.fireActivity;

  const score = Math.min(100, Math.max(0, Math.round(raw)));

  // Step 3: Level label
  const level = getRiskLevel(score);

  // Step 4: Fire statistics
  const fireStats = {
    count: nearbyFires.length,
    avgFRP: nearbyFires.length > 0
      ? nearbyFires.reduce((s, f) => s + (f.frp || 0), 0) / nearbyFires.length
      : 0,
    maxFRP: nearbyFires.length > 0
      ? Math.max(...nearbyFires.map((f) => f.frp || 0))
      : 0,
    highConfCount: nearbyFires.filter(
      (f) => f.confidence === 'high' || f.confidence === 'h'
    ).length,
  };

  // Step 5: Human-readable factor explanations
  const factors = generateExplanations(
    factorScores,
    { temperature, humidity, windSpeed, precipitation, radiusKm },
    fireStats
  );

  // Step 6: Structured factor breakdown for UI bars
  const factorBreakdown = [
    {
      key: 'temperature', label: 'Temperature', icon: 'thermometer',
      score: factorScores.temperature, weight: RISK_WEIGHTS.temperature,
      value: temperature !== null ? `${temperature?.toFixed(1)}°C` : 'N/A',
      impact: scoreToLabel(factorScores.temperature),
    },
    {
      key: 'humidity', label: 'Humidity', icon: 'droplets',
      score: factorScores.humidity, weight: RISK_WEIGHTS.humidity,
      value: humidity !== null ? `${humidity}%` : 'N/A',
      impact: scoreToLabel(factorScores.humidity),
    },
    {
      key: 'windSpeed', label: 'Wind Speed', icon: 'wind',
      score: factorScores.windSpeed, weight: RISK_WEIGHTS.windSpeed,
      value: windSpeed !== null ? `${windSpeed?.toFixed(1)} km/h` : 'N/A',
      impact: scoreToLabel(factorScores.windSpeed),
    },
    {
      key: 'precipitation', label: 'Precipitation', icon: 'cloud-rain',
      score: factorScores.precipitation, weight: RISK_WEIGHTS.precipitation,
      value: precipitation !== null ? `${precipitation?.toFixed(1)} mm` : 'N/A',
      impact: scoreToLabel(factorScores.precipitation),
    },
    {
      key: 'fireActivity', label: 'Fire Activity', icon: 'flame',
      score: factorScores.fireActivity, weight: RISK_WEIGHTS.fireActivity,
      value: `${fireStats.count} hotspot${fireStats.count !== 1 ? 's' : ''}`,
      impact: scoreToLabel(factorScores.fireActivity),
    },
  ];

  // Step 7: Model confidence
  const confidence = computeConfidence(hasWeather, nearbyFires);

  // Step 8: One-sentence summary
  const summaries = {
    LOW:      'Environmental conditions indicate low wildfire risk at this location.',
    MODERATE: 'Some risk factors are elevated. Monitor conditions and stay aware.',
    HIGH:     'High-risk conditions detected. Heightened caution and preparedness advised.',
    EXTREME:  'Extreme wildfire risk. Conditions are critical — take immediate precautions.',
  };

  return {
    score,
    level,
    confidence,
    factors,
    factorScores,
    factorBreakdown,
    fireStats,
    explanation: summaries[level],
    modelType: 'Explainable Weighted Scoring v1.1',
    weights: RISK_WEIGHTS,
  };
};

module.exports = { predictRisk };
