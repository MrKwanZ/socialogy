import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { diskStorage, Options as MulterOptions } from 'multer';

const ACCEPTED_MIME = new Set(['image/png', 'image/jpg', 'image/jpeg']);

export function createImageUploadOptions(uploadPath: string): MulterOptions {
  const imagesDir = join(process.cwd(), uploadPath);
  mkdirSync(imagesDir, { recursive: true });

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, imagesDir);
      },
      filename: (_req, _file, cb) => {
        cb(null, `${randomUUID()}-.jpg`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (ACCEPTED_MIME.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  };
}
