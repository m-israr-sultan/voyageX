import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { MonitoringService } from './monitoring.service';

/** Phase O — internal founder/admin operational monitoring. */
@Controller('admin/monitoring')
@Roles(UserRole.ADMIN)
export class MonitoringController {
  constructor(private readonly monitoring: MonitoringService) {}

  @Get('health')
  health() {
    return this.monitoring.getHealth();
  }
}
