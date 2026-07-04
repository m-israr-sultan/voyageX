export type EnvConfig = {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  BREVO_API_KEY: string;
  MAIL_FROM: string;
  WEATHER_API_KEY?: string;
  WEATHER_BASE_URL: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_REGION?: string;
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  STORAGE_BUCKET?: string;
};

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPort(value: unknown, fallback: number): number {
  const raw = readString(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return parsed;
}

function assertNoConflict(
  canonical: unknown,
  legacy: unknown,
  canonicalName: string,
  legacyName: string,
): void {
  const canonicalValue = readString(canonical);
  const legacyValue = readString(legacy);
  if (canonicalValue && legacyValue && canonicalValue !== legacyValue) {
    throw new Error(
      `Duplicate configuration: ${canonicalName} and ${legacyName} conflict. Use ${canonicalName} only.`,
    );
  }
}

export const validateEnv = (config: Record<string, unknown>): EnvConfig => {
  assertNoConflict(config.JWT_SECRET, config.JWT_ACCESS_SECRET, 'JWT_SECRET', 'JWT_ACCESS_SECRET');
  assertNoConflict(
    config.WEATHER_API_KEY,
    config.OPENWEATHER_API_KEY,
    'WEATHER_API_KEY',
    'OPENWEATHER_API_KEY',
  );

  const nodeEnv = readString(config.NODE_ENV) ?? 'development';
  const isProduction = nodeEnv === 'production';

  const jwtSecret = readString(config.JWT_SECRET) ?? readString(config.JWT_ACCESS_SECRET);
  const jwtRefreshSecret = readString(config.JWT_REFRESH_SECRET);
  const databaseUrl = readString(config.DATABASE_URL);

  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  if (!jwtSecret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  if (!jwtRefreshSecret) {
    throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
  }

  const frontendUrl =
    readString(config.FRONTEND_URL) ??
    (isProduction ? undefined : 'http://localhost:3000');

  if (isProduction && !frontendUrl) {
    throw new Error('Missing required production environment variable: FRONTEND_URL');
  }

  const brevoApiKey = readString(config.BREVO_API_KEY);
  const mailFrom = readString(config.MAIL_FROM);

  if (isProduction) {
    if (!brevoApiKey) throw new Error('Missing required production environment variable: BREVO_API_KEY');
    if (!mailFrom) throw new Error('Missing required production environment variable: MAIL_FROM');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: readPort(config.PORT, 8000),
    FRONTEND_URL: frontendUrl ?? 'http://localhost:3000',
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: readString(config.JWT_EXPIRES_IN) ?? '15m',
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_REFRESH_EXPIRES_IN: readString(config.JWT_REFRESH_EXPIRES_IN) ?? '7d',
    REDIS_HOST: readString(config.REDIS_HOST) ?? '127.0.0.1',
    REDIS_PORT: readPort(config.REDIS_PORT, 6379),
    REDIS_PASSWORD: readString(config.REDIS_PASSWORD),
    BREVO_API_KEY: brevoApiKey ?? '',
    MAIL_FROM: mailFrom ?? '',
    WEATHER_API_KEY:
      readString(config.WEATHER_API_KEY) ?? readString(config.OPENWEATHER_API_KEY),
    WEATHER_BASE_URL:
      readString(config.WEATHER_BASE_URL) ?? 'https://api.openweathermap.org/data/2.5',
    STORAGE_ENDPOINT: readString(config.STORAGE_ENDPOINT),
    STORAGE_REGION: readString(config.STORAGE_REGION),
    STORAGE_ACCESS_KEY: readString(config.STORAGE_ACCESS_KEY),
    STORAGE_SECRET_KEY: readString(config.STORAGE_SECRET_KEY),
    STORAGE_BUCKET: readString(config.STORAGE_BUCKET),
  };
};