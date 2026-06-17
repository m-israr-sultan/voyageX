import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { UpdateGuideProfileDto } from '../dto/guides.dto';
import { CoreService } from '../services/core.service';

@Controller('guides')
export class GuidesController {
  constructor(private readonly core: CoreService) {}

  // ============================================
  // SPECIFIC ROUTES MUST COME FIRST
  // ============================================

  @Get('my-profile')
  @Roles(UserRole.GUIDE)
  my(@CurrentUser() user: AuthUser) {
    return this.core.myGuideProfile(user.id);
  }

  @Put('my-profile')
  @Roles(UserRole.GUIDE)
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateGuideProfileDto) {
    return this.core.updateMyGuideProfile(user.id, body);
  }

  @Get('my-approval-status')
  @Roles(UserRole.GUIDE)
  getApprovalStatus(@CurrentUser() user: AuthUser) {
    return this.core.getGuideApprovalStatus(user.id);
  }

  // ============================================
  // PUBLIC ENDPOINTS (DYNAMIC ROUTES LAST)
  // ============================================

  @Get()
  @Public()
  list() {
    return this.core.guides();
  }

  @Get(':slug')
  @Public()
  get(@Param('slug') slug: string) {
    return this.core.guideBySlug(slug);
  }
}