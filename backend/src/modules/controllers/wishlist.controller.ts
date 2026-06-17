import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.interface';
import { CoreService } from '../services/core.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly core: CoreService) {}
  @Get() all(@CurrentUser() user: AuthUser) { return this.core.wishlist(user.id); }
  @Post(':packageId') add(@CurrentUser() user: AuthUser, @Param('packageId') packageId: string) { return this.core.addWishlist(user.id, packageId); }
  @Delete(':packageId') remove(@CurrentUser() user: AuthUser, @Param('packageId') packageId: string) { return this.core.removeWishlist(user.id, packageId); }
  @Get('check/:packageId') async check(@CurrentUser() user: AuthUser, @Param('packageId') packageId: string) {
    const list = await this.core.wishlist(user.id);
    return { exists: list.some((w) => w.packageId === packageId) };
  }
}
