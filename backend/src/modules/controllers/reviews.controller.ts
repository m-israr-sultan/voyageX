import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateReviewDto } from '../dto/reviews.dto';
import { CoreService } from '../services/core.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly core: CoreService) {}
  @Get('package/:packageId') @Public() byPackage(@Param('packageId') packageId: string) { return this.core.reviewsByPackage(packageId); }
  @Get('guide/:guideId') @Public() byGuide(@Param('guideId') guideId: string) { return this.core.reviewsByGuide(guideId); }
  @Get('agency/:agencyId') @Public() byAgency(@Param('agencyId') agencyId: string) { return this.core.reviewsByAgency(agencyId); }
  @Post() create(@CurrentUser() user: { id: string }, @Body() body: CreateReviewDto) { return this.core.createReview(user.id, body); }
  @Delete(':id') remove(@CurrentUser() user: { id: string }, @Param('id') id: string) { return this.core.deleteReview(id, user.id); }
}
