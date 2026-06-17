import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { CreateReportDto } from '../dto/reports.dto';
import { CoreService } from '../services/core.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly core: CoreService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() body: CreateReportDto) { return this.core.report(user.id, body); }
  @Get('my-reports') my(@CurrentUser() user: AuthUser) { return this.core.myReports(user.id); }
}
