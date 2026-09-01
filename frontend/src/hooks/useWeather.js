/**
 * hooks/useWeather.js
 * Custom hook for fetching weather at a lat/lon location.
 *
 * Usage:
 *   const { weather, loading, error, fetchWeather } = useWeather();
 *   fetchWeather(12.97, 77.59);
 *
 * Features:
 * - On-demand fetch (not auto-fetched on mount — requires explicit lat/lon)
 * - Tracks last fetched location
 * - Cancels stale requests (via AbortController)
 * - Normalises all loading/error/success states
 */

import { useState, useCallback, useRef } from 'react';
import { getWeather } from '../services/api';

/**
 * @typedef {Object} WeatherState
 * @property {Object|null}  weather       - Normalized weather data object, or null
 * @property {boolean}      loading       - True while fetching
 * @property {string|null}  error         - Error message if fetch failed
 * @property {Object|null}  location      - { lat, lon } last fetched
 * @property {Function}     fetchWeather  - Call with (lat, lon) to trigger fetch
 * @property {Function}     clearWeather  - Resets state back to initial
 */

/**
 * @returns {WeatherState}
 */
const useWeather = () => {
  const [weather,  setWeather]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [location, setLocation] = useState(null);

  // AbortController ref — cancels in-flight request if a new one starts
  const abortRef = useRef(null);

  /**
   * Fetch weather for the given coordinates.
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lon - Longitude (-180 to 180)
   */
  const fetchWeather = useCallback(async (lat, lon) => {
    // Cancel any existing in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setWeather(null);
    setLocation({ lat, lon });

    try {
      const res = await getWeather(lat, lon);
      const payload = res.data;

      if (payload.success) {
        setWeather(payload.data);
      } else {
        setError(payload.error || 'Failed to fetch weather.');
      }
    } catch (err) {
      // Ignore aborted requests — they're intentional cancellations
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;

      setError(
        err.response?.data?.error ||
        err.displayMessage ||
        err.message ||
        'Cannot connect to the weather API.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /** Reset all state back to initial (e.g. when user clears a location) */
  const clearWeather = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setWeather(null);
    setLoading(false);
    setError(null);
    setLocation(null);
  }, []);

  return { weather, loading, error, location, fetchWeather, clearWeather };
};

export default useWeather;
