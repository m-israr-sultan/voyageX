import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (e: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      return cb(new BadRequestException('Unsupported image MIME type'), false);
    }
    cb(null, true);
  },
};

export const documentUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (e: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED_DOC_MIME.has(file.mimetype)) {
      return cb(new BadRequestException('Unsupported document MIME type'), false);
    }
    cb(null, true);
  },
};