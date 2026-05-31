"use client";

import { useState, useEffect } from "react";

/**
 * Debounce a value by the specified delay (in ms).
 * Returns the debounced value that updates only after the delay passes
 * without the source value changing.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * // Use debouncedSearch in API calls
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
