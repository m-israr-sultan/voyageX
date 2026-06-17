import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  health(): Record<string, string> {
    return this.appService.health();
  }
}
