import { useState, useEffect } from 'react';

/**
 * Custom hook that delays updating the returned value until a specified delay has elapsed
 * since the last time the value was modified.
 * Useful for debouncing search queries and preventing excessive API requests.
 *
 * @param {string} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default: 250ms)
 * @returns {string} - The debounced value
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
