import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A React hook that provides a countdown timer functionality.
 *
 * @param initialSeconds - The initial number of seconds for the countdown.
 *
 * @returns An object containing:
 * - `secondsLeft`: The current number of seconds left in the countdown.
 * - `reset`: A function to reset the countdown to the initial seconds.
 */
export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalIdReference = useRef<NodeJS.Timeout | undefined>(undefined);

  // Function to start or restart the countdown.
  const startCountdown = useCallback(() => {
    // Clear any existing interval.
    if (intervalIdReference.current) {
      clearInterval(intervalIdReference.current);
      intervalIdReference.current = undefined;
    }

    // Don't start interval if value is 0 or negative.
    if (secondsLeft <= 0) return;

    intervalIdReference.current = setInterval(() => {
      setSecondsLeft(previous => {
        if (previous <= 1) {
          if (intervalIdReference.current) {
            clearInterval(intervalIdReference.current);
            intervalIdReference.current = undefined;
          }
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  }, [secondsLeft]);

  // Reset function to set the timer back to initialSeconds.
  const reset = useCallback(() => {
    setSecondsLeft(initialSeconds);
    // We'll start the countdown in the useEffect that watches secondsLeft.
  }, [initialSeconds]);

  // Effect to handle initialSeconds changes.
  useEffect(() => {
    // Reset the countdown when initialSeconds changes.
    setSecondsLeft(initialSeconds);
    // We'll start the countdown in the useEffect that watches secondsLeft.
  }, [initialSeconds]);

  // Effect to start/restart countdown when secondsLeft changes.
  useEffect(() => {
    startCountdown();

    // Cleanup interval on unmount or when secondsLeft changes.
    return () => {
      if (intervalIdReference.current) {
        clearInterval(intervalIdReference.current);
        intervalIdReference.current = undefined;
      }
    };
  }, [secondsLeft, startCountdown]);

  return { secondsLeft, reset };
}
