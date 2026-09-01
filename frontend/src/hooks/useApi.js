/**
 * hooks/useApi.js
 * Generic reusable data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(apiFunction, [dep1, dep2]);
 *
 * The hook automatically:
 * - Calls apiFunction on mount (and when deps change)
 * - Manages loading/error/data states
 * - Exposes refetch() for manual refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useApi = (apiFn, deps = [], options = {}) => {
  const { initialData = null, transformFn = null } = options;

  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Use a ref to prevent stale closure issues with apiFn
  const apiFnRef = useRef(apiFn);
  apiFnRef.current = apiFn;

  const fetch = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFnRef.current(...args);
      const raw = result?.data;
      setData(transformFn ? transformFn(raw) : raw);
    } catch (err) {
      setError(err.displayMessage || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

export default useApi;
