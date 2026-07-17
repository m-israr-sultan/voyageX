/**
 * Lightweight in-process API latency ring buffer for founder monitoring
 * (Phase O). No external APM dependency — samples are recorded by the
 * global LoggingInterceptor and surfaced via MonitoringService.getHealth().
 */

const MAX_SAMPLES = 500;
const samples: number[] = [];

export function recordApiLatency(durationMs: number): void {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  samples.push(durationMs);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

export function getApiLatencyStats(): {
  sampleCount: number;
  avgMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  maxMs: number | null;
} {
  if (samples.length === 0) {
    return { sampleCount: 0, avgMs: null, p50Ms: null, p95Ms: null, maxMs: null };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const percentile = (p: number) => {
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
  };
  return {
    sampleCount: sorted.length,
    avgMs: Math.round(sum / sorted.length),
    p50Ms: percentile(50),
    p95Ms: percentile(95),
    maxMs: sorted[sorted.length - 1],
  };
}
