import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AppConfigModule } from '../config/config.module';
import { TypedConfigService } from '../config/typed-config.service';
import { UsersModule } from '../users/users.module';
import { createImageUploadOptions } from './multer.config';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    AppConfigModule,
    UsersModule,
    MulterModule.registerAsync({
      imports: [AppConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const appConfig = config.get('app', { infer: true })!;
        return createImageUploadOptions(appConfig.uploadPath);
      },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
