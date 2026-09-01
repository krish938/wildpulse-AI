/**
 * controllers/firesController.js
 * Handles GET /api/fires — retrieves NASA FIRMS wildfire hotspot data.
 *
 * Data Flow:
 * GET /api/fires → getFires → firmsService.getFireHotspots() → CSV parse → normalize → JSON
 *
 * Caching behaviour:
 * - Results are cached for 10 minutes in firmsService to avoid hammering the NASA API.
 * - The ?refresh=true query param forces a fresh fetch (bypasses cache).
 *
 * Key design decision:
 * - We return HTTP 200 even when FIRMS is not configured or errors out.
 *   This lets the frontend degrade gracefully (show the map, show an info banner)
 *   rather than crashing the entire dashboard with a 5xx.
 */

const { getFireHotspots } = require('../services/firmsService');

/**
 * GET /api/fires
 *
 * Query params:
 *   ?refresh=true  — force bypass cache and fetch fresh data from NASA FIRMS
 *
 * Success response shape:
 * {
 *   success: true,
 *   count: number,
 *   data: [ { latitude, longitude, brightness, confidence, frp, satellite,
 *              instrument, acquisitionDate, acquisitionTime, dayNight, dataset } ],
 *   source: string,          // Dataset name, e.g. 'VIIRS_SNPP_NRT'
 *   dataSource: 'NASA FIRMS', // Attribution string for the frontend
 *   fetchedAt: string,       // ISO timestamp of the NASA API response
 *   cached: boolean,         // true if response came from in-memory cache
 *   cacheExpiresAt: string,  // ISO timestamp when the cache expires
 * }
 *
 * Graceful-degradation response (FIRMS not configured / error):
 * {
 *   success: false,
 *   data: [],
 *   error: string,
 *   configurationRequired?: boolean,
 *   dataSource: 'NASA FIRMS',
 * }
 */
const getFires = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const result = await getFireHotspots({ forceRefresh });

    if (!result.success) {
      // Return 200 with structured error — the map still renders, just without hotspots
      return res.status(200).json({
        success: false,
        data: [],
        count: 0,
        error: result.error,
        configurationRequired: result.configurationRequired || false,
        dataSource: 'NASA FIRMS',
        source: result.source,
      });
    }

    res.json({
      success: true,
      count: result.count,
      data: result.data,
      source: result.source,
      dataSource: 'NASA FIRMS',                 // Attribution for frontend display
      attribution: 'Data source: NASA FIRMS (Fire Information for Resource Management System)',
      fetchedAt: result.fetchedAt,
      cached: result.cached,
      stale: result.stale || false,
      cacheExpiresAt: result.cacheExpiresAt,
      warning: result.warning || null,          // Present if stale cache was returned
    });

  } catch (error) {
    next(error); // Pass to global error handler
  }
};

module.exports = { getFires };
