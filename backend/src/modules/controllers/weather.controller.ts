import { Controller, Get, Logger, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { WeatherService } from '../services/weather.service';

@Controller('weather')
@Public()
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weather: WeatherService) {}

  @Get('current')
  async current(@Query('city') city: string) {
    try {
      return await this.weather.current(city || '');
    } catch (err: unknown) {
      this.logger.warn(`[Weather] current failed for city="${city}": ${(err as Error)?.message}`);
      return { city: city || null, error: true, message: (err as Error)?.message };
    }
  }

  @Get('forecast')
  async forecast(@Query('city') city: string) {
    try {
      return await this.weather.forecast(city || '');
    } catch (err: unknown) {
      this.logger.warn(`[Weather] forecast failed for city="${city}": ${(err as Error)?.message}`);
      return { city: city || null, forecast: [], error: true, message: (err as Error)?.message };
    }
  }
}
