import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  uploadPath: string;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  uploadPath: process.env.UPLOAD_PATH ?? 'images',
}));
