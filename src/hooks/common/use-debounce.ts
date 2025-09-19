import { useCallback, useRef } from 'react';

/**
 * Hook for debouncing function calls
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns A debounced version of the callback function
 */
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
};

/**
 * Hook for debouncing with immediate execution option
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @param immediate - If true, execute immediately on first call
 * @returns A debounced version of the callback function
 */
export const useDebounceImmediate = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  immediate: boolean = false
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const immediateRef = useRef<boolean>(true);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediate && immediateRef.current;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        immediateRef.current = true;
        if (!immediate) {
          callback(...args);
        }
      }, delay);

      if (callNow) {
        immediateRef.current = false;
        callback(...args);
      }
    },
    [callback, delay, immediate]
  ) as T;

  return debouncedCallback;
};
