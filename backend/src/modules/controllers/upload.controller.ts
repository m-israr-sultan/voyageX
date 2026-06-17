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

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIME  = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  image(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be under 5MB');
    }
    const path = `uploads/images/${file.filename}`;
    return { path, url: path };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, imageUploadOptions))
  images(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('At least one image is required');
    for (const f of files) {
      if (!ALLOWED_IMAGE_MIME.has(f.mimetype)) {
        throw new BadRequestException(`File ${f.originalname}: only JPEG, PNG, or WebP allowed`);
      }
    }
    return files.map((f) => {
      const path = `uploads/images/${f.filename}`;
      return { path, url: path };
    });
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  document(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Document file is required');
    if (!ALLOWED_DOC_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, or PDF documents are allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Document must be under 10MB');
    }
    const path = `uploads/documents/${file.filename}`;
    return { path, url: path };
  }
}
