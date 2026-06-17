"use client";

import { useState, useCallback, useRef } from "react";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface RetryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  attempts: number;
  retry: () => void;
}

/**
 * Hook that wraps an async fetch with automatic retry logic.
 * Designed for low-connectivity Northern Pakistan networks.
 */
export function useRetry<T>(
  fetcher: () => Promise<T>,
  options: RetryOptions = {},
): RetryState<T> {
  const { maxAttempts = 3, delayMs = 1500, backoffMultiplier = 1.5 } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const attemptRef = useRef(0);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    attemptRef.current = 0;

    const tryFetch = async (): Promise<void> => {
      try {
        const result = await fetcher();
        setData(result);
        setAttempts(attemptRef.current + 1);
      } catch (err: any) {
        attemptRef.current++;
        setAttempts(attemptRef.current);

        if (attemptRef.current < maxAttempts) {
          const wait = delayMs * Math.pow(backoffMultiplier, attemptRef.current - 1);
          await new Promise((r) => setTimeout(r, wait));
          return tryFetch();
        }

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Network error. Please check your connection and try again.",
        );
      }
    };

    await tryFetch();
    setLoading(false);
  }, [fetcher, maxAttempts, delayMs, backoffMultiplier]);

  return { data, error, loading, attempts, retry: execute };
}
