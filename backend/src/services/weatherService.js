/**
 * services/weatherService.js
 * Open-Meteo weather data integration.
 *
 * What is Open-Meteo?
 * A free, open-source weather API — NO API KEY required for non-commercial use.
 * Provides current and forecast weather data for any latitude/longitude on Earth.
 *
 * Official documentation: https://open-meteo.com/en/docs
 * API endpoint: https://api.open-meteo.com/v1/forecast
 *
 * Key design decisions:
 * - We use the `current` parameter to request only current-conditions variables.
 *   This is more efficient than requesting hourly forecasts.
 * - We pass `timezone=auto` so the API localises the timestamp automatically.
 * - wind_speed_unit=kmh requests wind in km/h (not the default m/s).
 * - No API key is embedded or required.
 *
 * Data Flow:
 * Frontend → GET /api/weather?latitude=...&longitude=... →
 * weatherController → getCurrentWeather() →
 * Open-Meteo /v1/forecast → normalized JSON
 */

const axios = require('axios');
const { WEATHER_CONFIG } = require('../config/constants');

// ─── WMO Weather Code Descriptions ───────────────────────────────────────────
// WMO Weather Interpretation Codes (WW), used by Open-Meteo.
// Full code table: https://open-meteo.com/en/docs#weathervariables
const WMO_DESCRIPTIONS = {
  0:  'Clear sky',
  1:  'Mainly clear',   2:  'Partly cloudy',  3:  'Overcast',
  45: 'Fog',            48: 'Icy fog',
  51: 'Light drizzle',  53: 'Moderate drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle (light)', 57: 'Freezing drizzle (heavy)',
  61: 'Slight rain',    63: 'Moderate rain',  65: 'Heavy rain',
  66: 'Freezing rain (light)',    67: 'Freezing rain (heavy)',
  71: 'Slight snow',    73: 'Moderate snow',  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers',     86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/**
 * Maps an Open-Meteo WMO weather code to a human-readable description.
 * @param {number|null} code - WMO weather interpretation code
 * @returns {string} - Human-readable description, or 'Unknown' if code is unrecognised
 */
const describeWeatherCode = (code) => {
  if (code === null || code === undefined) return 'Unknown';
  return WMO_DESCRIPTIONS[code] ?? `Code ${code}`;
};

/**
 * Maps a WMO weather code to a category for the frontend icon selection.
 * @param {number|null} code
 * @returns {'clear'|'cloudy'|'fog'|'rain'|'snow'|'storm'|'unknown'}
 */
const categorizeWeatherCode = (code) => {
  if (code === null || code === undefined) return 'unknown';
  if (code === 0 || code === 1)                            return 'clear';
  if (code === 2 || code === 3)                            return 'cloudy';
  if (code === 45 || code === 48)                          return 'fog';
  if (code >= 51 && code <= 67)                            return 'rain';
  if (code >= 71 && code <= 77)                            return 'snow';
  if (code >= 80 && code <= 82)                            return 'rain';
  if (code >= 85 && code <= 86)                            return 'snow';
  if (code >= 95 && code <= 99)                            return 'storm';
  return 'unknown';
};

/**
 * Fetches current weather data for a given latitude/longitude from Open-Meteo.
 * No API key required.
 *
 * @param {number} latitude  - Decimal degrees, -90 to +90
 * @param {number} longitude - Decimal degrees, -180 to +180
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     latitude: number, longitude: number, timezone: string,
 *     temperature: number,    // °C — temperature at 2m
 *     feelsLike: number,      // °C — apparent temperature
 *     humidity: number,       // % — relative humidity at 2m
 *     windSpeed: number,      // km/h — wind speed at 10m
 *     windDirection: number,  // degrees — wind direction at 10m
 *     precipitation: number,  // mm — current precipitation
 *     weatherCode: number,    // WMO code
 *     weatherDescription: string,
 *     weatherCategory: string,
 *     timestamp: string,      // ISO 8601 local time from Open-Meteo
 *   } | null,
 *   error: string | null,
 *   errorType: 'validation'|'upstream'|'network'|null,
 * }>}
 */
const getCurrentWeather = async (latitude, longitude) => {
  // ── Coordinate validation ─────────────────────────────────────────────────
  if (
    latitude  === null || latitude  === undefined || typeof latitude  !== 'number' ||
    longitude === null || longitude === undefined || typeof longitude !== 'number' ||
    isNaN(latitude)  || isNaN(longitude) ||
    latitude < -90  || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return {
      success: false,
      data: null,
      error: `Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180. Got (${latitude}, ${longitude}).`,
      errorType: 'validation',
    };
  }

  // ── Build Open-Meteo request URL ──────────────────────────────────────────
  // The API expects comma-separated variable names in the `current` parameter.
  // Full variable list: https://open-meteo.com/en/docs#current-weather-api
  const currentVars = [
    'temperature_2m',        // Air temperature at 2 m above ground (°C)
    'relative_humidity_2m',  // Relative humidity at 2 m (%)
    'apparent_temperature',  // Feels-like temperature accounting for wind/humidity (°C)
    'wind_speed_10m',        // Wind speed at 10 m above ground (km/h when wind_speed_unit=kmh)
    'wind_direction_10m',    // Wind direction at 10 m (°)
    'precipitation',         // Total liquid precipitation (mm)
    'weather_code',          // WMO weather interpretation code
  ].join(',');

  // Build query string manually.
  // Reason: axios serialises arrays as `key[]=val` — Open-Meteo expects `key=a,b,c`.
  const queryString = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    `current=${currentVars}`,
    `wind_speed_unit=kmh`,   // Return wind in km/h (default would be m/s)
    `timezone=auto`,         // Auto-detect timezone from lat/lon
  ].join('&');

  const url = `${WEATHER_CONFIG.BASE_URL}?${queryString}`;

  try {
    console.log(`[Weather] GET ${url.replace(WEATHER_CONFIG.BASE_URL, '[Open-Meteo]')}`);

    const response = await axios.get(url, {
      timeout: 12000, // 12 second timeout
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WildPulse-AI/1.0 (wildfire monitoring)',
      },
    });

    const raw = response.data;

    // Guard: unexpected response shape
    if (!raw || !raw.current || !raw.current_units) {
      throw new Error('Open-Meteo returned an unexpected response structure.');
    }

    const c = raw.current;

    // ── Normalize to internal schema ─────────────────────────────────────────
    const weatherCode = c.weather_code ?? null;
    const normalized = {
      // ── Location (as returned by Open-Meteo, rounded to 4 decimal places) ──
      latitude:  raw.latitude,
      longitude: raw.longitude,
      timezone:  raw.timezone || 'UTC',

      // ── Temperature ───────────────────────────────────────────────────────
      temperature:  c.temperature_2m ?? null,        // °C
      feelsLike:    c.apparent_temperature ?? null,   // °C

      // ── Humidity ──────────────────────────────────────────────────────────
      humidity: c.relative_humidity_2m ?? null,       // %

      // ── Wind ──────────────────────────────────────────────────────────────
      windSpeed:     c.wind_speed_10m     ?? null,    // km/h
      windDirection: c.wind_direction_10m ?? null,    // degrees (0 = North)

      // ── Precipitation ─────────────────────────────────────────────────────
      precipitation: c.precipitation ?? null,          // mm

      // ── Weather Code & Description ────────────────────────────────────────
      weatherCode,
      weatherDescription: describeWeatherCode(weatherCode),
      weatherCategory:    categorizeWeatherCode(weatherCode),

      // ── Timestamp (local time from Open-Meteo) ────────────────────────────
      // This is the observation time in the timezone that was auto-detected.
      timestamp: c.time ?? new Date().toISOString(),
    };

    console.log(
      `[Weather] OK — ${normalized.temperature}°C, ` +
      `${normalized.humidity}% humidity, ` +
      `${normalized.windSpeed} km/h wind at (${latitude}, ${longitude})`
    );

    return { success: true, data: normalized, error: null, errorType: null };

  } catch (error) {
    // ── Map error types to user-facing messages ───────────────────────────────
    let errorMessage = 'Failed to fetch weather data from Open-Meteo.';
    let errorType = 'upstream';

    if (error.response) {
      const status = error.response.status;
      const apiMsg = error.response.data?.reason || error.response.data?.error || '';

      if (status === 400) {
        // Open-Meteo returns 400 for invalid coordinates or bad parameters
        errorMessage = `Invalid request to Open-Meteo: ${apiMsg || 'check coordinates.'}`;
        errorType = 'validation';
      } else if (status === 429) {
        errorMessage = 'Open-Meteo rate limit exceeded. Please try again in a moment.';
      } else if (status >= 500) {
        errorMessage = 'Open-Meteo servers are temporarily unavailable. Please try again.';
      } else {
        errorMessage = `Open-Meteo responded with status ${status}: ${apiMsg}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'Weather request timed out. Please try again.';
      errorType = 'network';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot reach Open-Meteo (network error). Check your internet connection.';
      errorType = 'network';
    }

    console.error(`[Weather] Error at (${latitude}, ${longitude}):`, error.message);

    return { success: false, data: null, error: errorMessage, errorType };
  }
};

module.exports = { getCurrentWeather, describeWeatherCode, categorizeWeatherCode };
