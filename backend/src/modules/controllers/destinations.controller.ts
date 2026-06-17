import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateDestinationDto, UpdateDestinationDto } from '../dto/destinations.dto';
import { CoreService } from '../services/core.service';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly core: CoreService) {}
  @Get() @Public() list() { return this.core.destinations(); }
  @Get(':slug') @Public() get(@Param('slug') slug: string) { return this.core.destinationBySlug(slug); }
  @Post() @Roles(UserRole.ADMIN) create(@Body() body: CreateDestinationDto) { return this.core.createDestination(body); }
  @Put(':id') @Roles(UserRole.ADMIN) update(@Param('id') id: string, @Body() body: UpdateDestinationDto) { return this.core.updateDestination(id, body); }
  @Delete(':id') @Roles(UserRole.ADMIN) remove(@Param('id') id: string, @Query('hard') hard?: string) { return this.core.deleteDestination(id, hard === 'true'); }
}