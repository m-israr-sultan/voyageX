import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { CreatePackageDto, UpdatePackageDto } from '../dto/packages.dto';
import { CoreService } from '../services/core.service';

@Controller('packages')
export class PackagesController {
  constructor(private readonly core: CoreService) {}

  @Get() @Public() list() { return this.core.packages(); }

  @Get('my-packages') @Roles(UserRole.GUIDE, UserRole.AGENCY)
  mine(@CurrentUser() user: AuthUser) { return this.core.myPackages(user.id, user.role); }

  @Post() @Roles(UserRole.GUIDE, UserRole.AGENCY)
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePackageDto) { return this.core.createPackage(user.id, user.role, body); }

  @Put(':id') @Roles(UserRole.GUIDE, UserRole.AGENCY, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: UpdatePackageDto) { return this.core.updatePackage(id, body); }

  @Delete(':id') @Roles(UserRole.GUIDE, UserRole.AGENCY, UserRole.ADMIN)
  remove(@Param('id') id: string, @Query('hard') hard?: string) { return this.core.deletePackage(id, hard === 'true'); }

  @Get(':slug') @Public() get(@Param('slug') slug: string) { return this.core.packageBySlug(slug); }
}