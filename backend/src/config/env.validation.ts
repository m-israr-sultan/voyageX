export type EnvConfig = {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENWEATHER_API_KEY?: string;
};

export const validateEnv = (config: Record<string, unknown>): EnvConfig => {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    const v = config[key];
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return config as EnvConfig;
};
