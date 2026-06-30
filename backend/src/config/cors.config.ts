/**
 * Resolves CORS origin for HTTP and WebSocket gateways.
 * In production, only FRONTEND_URL is allowed.
 * In development, all origins are allowed for local testing.
 */
export function resolveCorsOrigin(): boolean | string | string[] {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (nodeEnv === 'production' && frontendUrl) {
    return frontendUrl
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return true;
}
