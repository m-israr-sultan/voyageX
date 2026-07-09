import {
  Controller,
  Get,
  Param,
  Res,
  Query,
  NotFoundException,
  Logger,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private imagesService: ImagesService) {}

  /**
   * PROXY ENDPOINT: Fetches image from Supabase and streams it to frontend
   * URL format: /api/v1/images/:bucket/:fileName
   * Example: /api/v1/images/images/1715160000-abc123.jpg
   */
  @Get(':bucket/:fileName')
  @ApiOperation({ summary: 'Proxy image from Supabase storage' })
  @ApiResponse({ status: 200, description: 'Image returned successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImage(
    @Param('bucket') bucket: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Fetching image: ${bucket}/${fileName}`);

      const imageBuffer = await this.imagesService.getImage(bucket, fileName);

      // Determine content type from file extension
      const ext = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'svg') contentType = 'image/svg+xml';
      else if (ext === 'pdf') contentType = 'application/pdf';

      // ✅ Set CORS headers for cross-origin requests (Vercel → Render)
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // ✅ Set caching headers
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', imageBuffer.length.toString());

      // ✅ Send the buffer
      res.status(HttpStatus.OK).send(imageBuffer);

      this.logger.log(`Image served: ${bucket}/${fileName} (${imageBuffer.length} bytes)`);
    } catch (error) {
      this.logger.error(`Failed to serve image ${bucket}/${fileName}:`, error);

      // ✅ Properly handle error response when using @Res()
      if (!res.headersSent) {
        res.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'Image not found',
          error: 'Not Found',
        });
      }
    }
  }

  /**
   * Generate signed URL for private files (admin-only)
   */
  @Get('signed-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate signed URL for private file (Admin only)' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  @ApiResponse({ status: 404, description: 'Bucket and path are required' })
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

    // ✅ FIXED: Added 'data' property key (was causing syntax error)
    return {
      success: true,
      data: { signedUrl, expiresIn: expirySeconds },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete file (admin-only)
   * Note: Consider using @Delete instead of @Get for delete operations
   */
  @Get('delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete file from storage (Admin only)' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  @ApiResponse({ status: 404, description: 'Bucket and path are required' })
  async deleteFile(
    @Query('bucket') bucket: string,
    @Query('path') path: string,
  ) {
    if (!bucket || !path) {
      throw new NotFoundException('Bucket and path are required');
    }

    const success = await this.imagesService.deleteFile(bucket, path);

    return {
      success,
      message: success ? 'File deleted' : 'Failed to delete file',
      timestamp: new Date().toISOString(),
    };
  }
}