import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const secureFileName = (originalname: string): string => {
  const ext = extname(originalname).toLowerCase();
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${base}${ext}`;
};

const ensureDir = (dir: string): void => {
  mkdirSync(dir, { recursive: true });
};

export const imageUploadOptions = {
  storage: diskStorage({
    destination: (_req: unknown, _file: Express.Multer.File, cb: (e: Error | null, p: string) => void) => {
      const dir = 'uploads/images';
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, n: string) => void) => {
      cb(null, secureFileName(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      return cb(new BadRequestException('Unsupported image MIME type'), false);
    }
    cb(null, true);
  }
};

export const documentUploadOptions = {
  storage: diskStorage({
    destination: (_req: unknown, _file: Express.Multer.File, cb: (e: Error | null, p: string) => void) => {
      const dir = 'uploads/documents';
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, n: string) => void) => {
      cb(null, secureFileName(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, accept: boolean) => void) => {
    if (!ALLOWED_DOC_MIME.has(file.mimetype)) {
      return cb(new BadRequestException('Unsupported document MIME type'), false);
    }
    cb(null, true);
  }
};
