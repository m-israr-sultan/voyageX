import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

type CacheEntry = { expiresAt: number; payload: unknown };
type OpenWeatherCurrent = {
  name: string;
  sys?: { country?: string };
  main?: { temp?: number; feels_like?: number; humidity?: number };
  wind?: { speed?: number };
  weather?: Array<{ description?: string }>;
};
type OpenWeatherForecast = {
  city?: { name?: string; country?: string };
  list?: Array<{ dt_txt?: string; main?: { temp?: number }; weather?: Array<{ description?: string }> }>;
};

@Injectable()
export class WeatherService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly appConfig: AppConfigService) {}

  private get apiKey(): string {
    return this.appConfig.weatherApiKey;
  }

  private get baseUrl(): string {
    return this.appConfig.weatherBaseUrl;
  }

  private async fetchJson<T>(url: string, city: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`[Weather] Provider error for city="${city}" status=${res.status} body=${body.slice(0, 200)}`);
        throw new HttpException(
          res.status === 404 ? 'Location not found' : 'Weather provider error',
          res.status === 404 ? HttpStatus.NOT_FOUND : HttpStatus.BAD_GATEWAY,
        );
      }
      return (await res.json()) as T;
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`[Weather] Request failed for city="${city}": ${(err as Error).message}`);
      throw new HttpException('Weather service unavailable', HttpStatus.BAD_GATEWAY);
    } finally {
      clearTimeout(timeout);
    }
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.payload as T;
  }

  private setCached(key: string, payload: unknown): void {
    this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, payload });
  }

  async current(city: string) {
    if (!this.apiKey) {
      throw new HttpException('Weather API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const cacheKey = `current:${city.toLowerCase()}`;
    const cached = this.getCached<unknown>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
    const data = await this.fetchJson<OpenWeatherCurrent>(url, city);
    const payload = {
      city: data.name,
      country: data.sys?.country ?? '',
      temperature: data.main?.temp ?? null,
      feelsLike: data.main?.feels_like ?? null,
      humidity: data.main?.humidity ?? null,
      windSpeed: data.wind?.speed ?? null,
      description: data.weather?.[0]?.description ?? '',
    };
    this.setCached(cacheKey, payload);
    return payload;
  }

  async forecast(city: string) {
    if (!this.apiKey) {
      throw new HttpException('Weather API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const cacheKey = `forecast:${city.toLowerCase()}`;
    const cached = this.getCached<unknown>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
    const data = await this.fetchJson<OpenWeatherForecast>(url, city);
    const payload = {
      city: data.city?.name ?? city,
      country: data.city?.country ?? '',
      forecast:
        data.list?.slice(0, 8).map((item) => ({
          datetime: item.dt_txt ?? '',
          temperature: item.main?.temp ?? null,
          description: item.weather?.[0]?.description ?? '',
        })) ?? [],
    };
    this.setCached(cacheKey, payload);
    return payload;
  }
}
