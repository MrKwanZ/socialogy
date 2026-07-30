import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { envValidationSchema } from './config.types';
import { databaseConfig } from './database.config';
import { TypedConfigService } from './typed-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
  providers: [
    {
      provide: TypedConfigService,
      useExisting: ConfigService,
    },
  ],
  exports: [TypedConfigService],
})
export class AppConfigModule {}
