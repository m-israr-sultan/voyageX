import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

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
  private readonly apiKey = process.env.OPENWEATHER_API_KEY ?? '';
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private readonly logger = new Logger(WeatherService.name);

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

  private async withCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.cache.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return existing.payload as T;
    }
    const payload = await loader();
    this.cache.set(key, { payload, expiresAt: Date.now() + this.cacheTtlMs });
    return payload;
  }

  async current(city: string): Promise<unknown> {
    if (!city?.trim()) {
      this.logger.warn('[Weather] current() called with empty city');
      throw new HttpException('City is required', HttpStatus.BAD_REQUEST);
    }
    const key = `current:${city.toLowerCase()}`;
    return this.withCache(key, async () => {
      const data = await this.fetchJson<OpenWeatherCurrent>(
        `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`,
        city,
      );
      return {
        city: data.name,
        country: data.sys?.country,
        temperature: data.main?.temp,
        feelsLike: data.main?.feels_like,
        humidity: data.main?.humidity,
        windSpeed: data.wind?.speed,
        description: data.weather?.[0]?.description
      };
    });
  }

  async forecast(city: string): Promise<unknown> {
    if (!city?.trim()) {
      this.logger.warn('[Weather] forecast() called with empty city');
      throw new HttpException('City is required', HttpStatus.BAD_REQUEST);
    }
    const key = `forecast:${city.toLowerCase()}`;
    return this.withCache(key, async () => {
      const data = await this.fetchJson<OpenWeatherForecast>(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`,
        city,
      );
      return {
        city: data.city?.name,
        country: data.city?.country,
        forecast: (data.list ?? []).slice(0, 8).map((x) => ({
          date: x.dt_txt,
          temp: x.main?.temp,
          description: x.weather?.[0]?.description
        }))
      };
    });
  }
}
