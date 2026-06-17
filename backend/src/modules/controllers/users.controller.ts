import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { ChangePasswordDto, UpdateMeDto } from '../dto/users.dto';
import { CoreService } from '../services/core.service';

@Controller('users')
export class UsersController {
  constructor(private readonly core: CoreService) {}
  @Get('me') me(@CurrentUser() user: AuthUser) { return this.core.me(user.id); }
  @Put('me') update(@CurrentUser() user: AuthUser, @Body() body: UpdateMeDto) { return this.core.updateMe(user.id, body); }
  @Delete('me') delete(@CurrentUser() user: AuthUser) { return this.core.deleteMe(user.id); }
  @Post('change-password') changePassword(@CurrentUser() user: AuthUser, @Body() body: ChangePasswordDto) { return this.core.changePassword(user.id, body); }
  @Get('me/bookings') myBookings(@CurrentUser() user: AuthUser) { return this.core.bookings(user.id, user.role); }
  @Get('me/reviews') myReviews(@CurrentUser() user: AuthUser) { return this.core.myReviews(user.id); }
  @Get('me/wishlist') myWishlist(@CurrentUser() user: AuthUser) { return this.core.wishlist(user.id); }
}
