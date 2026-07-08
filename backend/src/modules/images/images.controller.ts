
import {
  Controller,
  Get,
  Param,
  Res,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ImagesService } from './images.service';

@Controller('api/v1/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Get(':bucket/*')
  async getImage(
    @Param('bucket') bucket: string,
    @Param('0') path: string,
    @Res() res: Response,
  ) {
    try {
      const imageBuffer = await this.imagesService.getImage(bucket, path);

      const ext = path.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'pdf') contentType = 'application/pdf';

      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', contentType);
      res.send(imageBuffer);
    } catch (error) {
      throw new NotFoundException('Image not found');
    }
  }

  @Get('signed-url')
  async getSignedUrl(
    @Query('bucket') bucket: string,
    @Query('path') path: string,
    @Query('expiresIn') expiresIn: string,
  ) {
    if (!bucket || !path) {
      throw new NotFoundException('Bucket and path are required');
    }

    const expirySeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const signedUrl = await this.imagesService.getSignedUrl(
      bucket,
      path,
      expirySeconds,
    );

    return { signedUrl, expiresIn: expirySeconds };
  }
}