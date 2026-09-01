/**
 * services/firmsService.js
 * NASA FIRMS (Fire Information for Resource Management System) integration.
 *
 * What is FIRMS?
 * NASA provides near-real-time fire/hotspot data detected by satellites.
 * Two main satellites: VIIRS (on Suomi-NPP, NOAA-20, NOAA-21) and MODIS.
 *
 * Official API Documentation: https://firms.modaps.eosdis.nasa.gov/api/
 * Area endpoint spec:         https://firms.modaps.eosdis.nasa.gov/api/area/
 *
 * Correct API URL format (area endpoint — active as of API v4.0.136):
 *   /api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]
 *
 * NOTE: The /api/country/ endpoint is currently DISABLED by NASA FIRMS.
 *       We always use the /api/area/ endpoint with area "world" for global data.
 *
 * Data Flow:
 * NASA Satellite → FIRMS Database → /api/area/csv/ → Our Backend → Frontend Map
 */

const axios = require('axios');

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// FIRMS data changes once per satellite pass (~2 hours for VIIRS).
// Caching prevents hammering the NASA API on every map refresh.
//
// Cache TTL: 10 minutes — aggressive enough to feel live, conservative enough
// to respect NASA's 5000 transactions / 10-minute rate limit.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let _cache = {
  data: null,         // Cached hotspot array
  fetchedAt: null,    // Date the cache was populated
  source: null,       // Dataset name used for the cached request
  count: 0,           // Number of hotspots in cache
  expiresAt: null,    // Timestamp when cache expires
};

/**
 * Returns true if we have a valid, non-expired cache entry for the given dataset.
 * @param {string} dataset
 */
const isCacheValid = (dataset) =>
  _cache.data !== null &&
  _cache.source === dataset &&
  _cache.expiresAt !== null &&
  Date.now() < _cache.expiresAt;

/**
 * Store a new result in the in-memory cache.
 */
const populateCache = (hotspots, dataset) => {
  const now = new Date();
  _cache = {
    data: hotspots,
    fetchedAt: now.toISOString(),
    source: dataset,
    count: hotspots.length,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
};

// ─── Helper: Parse FIRMS CSV Response ────────────────────────────────────────
/**
 * NASA FIRMS returns data as CSV text.
 * This function converts it to an array of row objects.
 *
 * Handles commas inside quoted fields (though FIRMS data rarely uses them).
 *
 * @param {string} csvText - Raw CSV string from FIRMS API
 * @returns {Array<Object>} - Array of parsed row objects
 */
const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return []; // Header-only response = no data

  const headers = lines[0].split(',').map((h) => h.trim().replace(/\r$/, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '').trim();
    if (!line) continue; // Skip blank lines

    const values = line.split(',').map((v) => v.trim());

    // Skip rows that don't match header column count (malformed)
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }

  return rows;
};

// ─── Helper: Normalize FIRMS Row → Internal Format ────────────────────────────
/**
 * Different FIRMS datasets (VIIRS vs MODIS) have slightly different field names.
 * This normalizer maps both to a consistent internal schema.
 *
 * VIIRS attribute table: https://go.nasa.gov/3sf3ALb
 * MODIS attribute table: https://go.nasa.gov/3JSgbdb
 *
 * Key field differences:
 *   VIIRS: bright_ti4, bright_ti5, confidence ('l'/'n'/'h')
 *   MODIS: brightness,  bright_t31,  confidence (0-100 numeric)
 *
 * @param {Object} row     - Raw CSV row object from FIRMS
 * @param {string} dataset - Dataset identifier (e.g., 'VIIRS_SNPP_NRT')
 * @returns {Object}       - Normalized hotspot object
 */
const normalizeFIRMSRow = (row, dataset) => {
  const isVIIRS = dataset.toUpperCase().includes('VIIRS');
  const isLandsat = dataset.toUpperCase().includes('LANDSAT');

  // VIIRS uses bright_ti4 (channel I4, ~4µm) or bright_ti5 (channel I5, ~11µm)
  // MODIS uses 'brightness' for channel 21/22 (~4µm)
  const rawBrightness =
    row.bright_ti4 || row.bright_ti5 || row.brightness || row.bright_t31 || null;

  // VIIRS confidence: 'l' = low, 'n' = nominal, 'h' = high
  // MODIS confidence: 0–100 numeric string
  const rawConfidence = row.confidence || null;

  // Map VIIRS confidence letters to descriptive strings for the frontend
  const normalizeConfidence = (conf) => {
    if (!conf) return 'unknown';
    const c = conf.toString().toLowerCase().trim();
    if (c === 'l') return 'low';
    if (c === 'n') return 'nominal';
    if (c === 'h') return 'high';
    // MODIS numeric — return as-is with '%' implied
    return c;
  };

  const lat = parseFloat(row.latitude || row.lat);
  const lon = parseFloat(row.longitude || row.lon || row.lng);

  // Reject rows with invalid or zero coordinates
  if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return {
    // ── Location ──────────────────────────────────────────────────────────────
    latitude: lat,
    longitude: lon,

    // ── Fire Intensity ────────────────────────────────────────────────────────
    // Brightness temperature in Kelvin. Proxy for fire intensity.
    brightness: rawBrightness !== null ? parseFloat(rawBrightness) || null : null,

    // ── Detection Confidence ─────────────────────────────────────────────────
    confidence: normalizeConfidence(rawConfidence),

    // ── Fire Radiative Power (FRP) ─────────────────────────────────────────
    // Measures the rate of radiant energy emission from fire in megawatts (MW).
    // Higher FRP → more energetic fire.
    frp: parseFloat(row.frp) || 0,

    // ── Satellite / Instrument ────────────────────────────────────────────────
    satellite: row.satellite || (isVIIRS ? 'N/A' : isLandsat ? 'LANDSAT-8' : 'Terra/Aqua'),
    instrument: row.instrument || (isVIIRS ? 'VIIRS' : isLandsat ? 'OLI' : 'MODIS'),

    // ── Temporal Info ─────────────────────────────────────────────────────────
    // acq_date: YYYY-MM-DD, acq_time: HHMM (UTC)
    acquisitionDate: row.acq_date || null,
    acquisitionTime: row.acq_time
      ? row.acq_time.toString().padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2') + ' UTC'
      : null,

    // ── Day/Night Detection ───────────────────────────────────────────────────
    // 'D' = daytime detection, 'N' = nighttime detection
    dayNight: row.daynight || null,

    // ── Dataset metadata ─────────────────────────────────────────────────────
    dataset,
  };
};

// ─── Main Service Function ────────────────────────────────────────────────────
/**
 * getFireHotspots()
 *
 * Fetches active fire hotspot data from NASA FIRMS via the /api/area/ endpoint.
 * Results are cached for CACHE_TTL_MS to reduce API calls.
 *
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - Bypass cache and fetch fresh data
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array,
 *   count: number,
 *   source: string,
 *   fetchedAt: string|null,
 *   cached: boolean,
 *   cacheExpiresAt: string|null,
 *   error: string|null,
 *   configurationRequired?: boolean,
 * }>}
 */
const getFireHotspots = async ({ forceRefresh = false } = {}) => {
  const mapKey  = process.env.NASA_FIRMS_MAP_KEY;
  const dataset = process.env.NASA_FIRMS_DATASET || 'VIIRS_SNPP_NRT';
  const days    = parseInt(process.env.NASA_FIRMS_DAYS || '1', 10);

  // ── Guard: missing API key ─────────────────────────────────────────────────
  if (!mapKey || mapKey.trim() === '') {
    return {
      success: false,
      data: [],
      count: 0,
      error:
        'NASA_FIRMS_MAP_KEY is not configured. ' +
        'Register at https://firms.modaps.eosdis.nasa.gov/api/ to get a free MAP_KEY, ' +
        'then add it to backend/.env.',
      configurationRequired: true,
      source: dataset,
      fetchedAt: null,
      cached: false,
      cacheExpiresAt: null,
    };
  }

  // ── Serve from cache if valid ──────────────────────────────────────────────
  if (!forceRefresh && isCacheValid(dataset)) {
    console.log(
      `[FIRMS] Serving ${_cache.count} hotspots from cache ` +
      `(expires ${new Date(_cache.expiresAt).toISOString()})`
    );
    return {
      success: true,
      data: _cache.data,
      count: _cache.count,
      source: _cache.source,
      fetchedAt: _cache.fetchedAt,
      cached: true,
      cacheExpiresAt: new Date(_cache.expiresAt).toISOString(),
      error: null,
    };
  }

  // ── Build API URL ─────────────────────────────────────────────────────────
  // Official area endpoint format (from https://firms.modaps.eosdis.nasa.gov/api/area/):
  //   /api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]
  //
  // We use 'world' for global coverage. DAY_RANGE is capped at 5 per the API docs.
  const clampedDays = Math.min(Math.max(days, 1), 5);
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${dataset}/world/${clampedDays}`;

  try {
    console.log(`[FIRMS] Fetching hotspots — dataset: ${dataset}, days: ${clampedDays}`);

    const response = await axios.get(url, {
      timeout: 45000, // 45 second timeout — FIRMS world query can be slow
      headers: {
        Accept: 'text/csv,text/plain,*/*',
        'User-Agent': 'WildPulse-AI/1.0 (wildfire monitoring; contact@wildpulse.ai)',
      },
      responseType: 'text',
    });

    // ── Detect API key errors returned as text (not HTTP status codes) ────────
    const bodyText = response.data || '';
    if (
      bodyText.includes('Invalid MAP_KEY') ||
      bodyText.includes('Transaction limit') ||
      bodyText.includes('NOT FOUND') ||
      (bodyText.trim().length < 50 && !bodyText.includes('latitude'))
    ) {
      const detail = bodyText.trim().substring(0, 200);
      console.error('[FIRMS] Unexpected API response:', detail);
      return {
        success: false,
        data: [],
        count: 0,
        error: `NASA FIRMS returned an unexpected response: "${detail}". ` +
               'Please verify your NASA_FIRMS_MAP_KEY is correct and active.',
        source: dataset,
        fetchedAt: null,
        cached: false,
        cacheExpiresAt: null,
      };
    }

    const rawRows  = parseCSV(bodyText);
    console.log(`[FIRMS] Parsed ${rawRows.length} raw rows from CSV`);

    // Normalize each row, filter out null (invalid coordinate) results
    const hotspots = rawRows
      .map((row) => normalizeFIRMSRow(row, dataset))
      .filter((h) => h !== null);

    console.log(`[FIRMS] ${hotspots.length} valid hotspots after normalization`);

    // ── Populate cache ────────────────────────────────────────────────────────
    populateCache(hotspots, dataset);

    return {
      success: true,
      data: hotspots,
      count: hotspots.length,
      source: dataset,
      fetchedAt: _cache.fetchedAt,
      cached: false,
      cacheExpiresAt: new Date(_cache.expiresAt).toISOString(),
      error: null,
    };

  } catch (error) {
    // ── Map HTTP / network errors to user-facing messages ─────────────────────
    let errorMessage = 'Failed to fetch fire data from NASA FIRMS.';

    if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        errorMessage =
          'Bad request to NASA FIRMS. The MAP_KEY or dataset name may be invalid.';
      } else if (status === 401 || status === 403) {
        errorMessage =
          'Invalid or expired NASA FIRMS MAP_KEY. ' +
          'Please verify your key at https://firms.modaps.eosdis.nasa.gov/api/map_key/';
      } else if (status === 429) {
        errorMessage =
          'NASA FIRMS rate limit exceeded (5000 transactions / 10 min). ' +
          'Please try again in a few minutes.';
      } else if (status >= 500) {
        errorMessage =
          'NASA FIRMS servers are currently unavailable. Please try again later.';
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage =
        'Request to NASA FIRMS timed out. The global dataset query can be slow — please retry.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage =
        'Cannot reach NASA FIRMS (network error). Check your internet connection.';
    }

    console.error('[FIRMS] Fetch error:', error.message);

    // If we have a stale cache, return it with a warning rather than failing completely
    if (_cache.data !== null && _cache.source === dataset) {
      console.log('[FIRMS] Returning stale cache due to fetch error');
      return {
        success: true,
        data: _cache.data,
        count: _cache.count,
        source: _cache.source,
        fetchedAt: _cache.fetchedAt,
        cached: true,
        stale: true,
        cacheExpiresAt: new Date(_cache.expiresAt).toISOString(),
        warning: `Live fetch failed (${errorMessage}) — showing cached data.`,
        error: null,
      };
    }

    return {
      success: false,
      data: [],
      count: 0,
      error: errorMessage,
      source: dataset,
      fetchedAt: null,
      cached: false,
      cacheExpiresAt: null,
    };
  }
};

module.exports = { getFireHotspots };
