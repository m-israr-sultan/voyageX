import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  documentUploadOptions,
  imageUploadOptions
} from '../upload.config';
import { ImagesService } from '../images/images.service'; // ✅ Add this

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIME  = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

@Controller('upload')
export class UploadController {
  constructor(private imagesService: ImagesService) {} // ✅ Add constructor

  @Post('image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async image(@UploadedFile() file: Express.Multer.File) { // ✅ Add async
    if (!file) throw new BadRequestException('Image file is required');
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be under 5MB');
    }

    // ✅ Upload to Supabase instead of local disk
    const result = await this.imagesService.uploadImage(
      'images',
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return result;
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, imageUploadOptions))
  async images(@UploadedFiles() files: Express.Multer.File[]) { // ✅ Add async
    if (!files?.length) throw new BadRequestException('At least one image is required');
    for (const f of files) {
      if (!ALLOWED_IMAGE_MIME.has(f.mimetype)) {
        throw new BadRequestException(`File ${f.originalname}: only JPEG, PNG, or WebP allowed`);
      }
    }

    // ✅ Upload all to Supabase
    const results = await Promise.all(
      files.map((file) =>
        this.imagesService.uploadImage(
          'images',
          file.buffer,
          file.originalname,
          file.mimetype,
        )
      )
    );
    return results;
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  async document(@UploadedFile() file: Express.Multer.File) { // ✅ Add async
    if (!file) throw new BadRequestException('Document file is required');
    if (!ALLOWED_DOC_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, or PDF documents are allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Document must be under 10MB');
    }

    // ✅ Upload to Supabase
    const result = await this.imagesService.uploadImage(
      'documents',
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return result;
  }
}