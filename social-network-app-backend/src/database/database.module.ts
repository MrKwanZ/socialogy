import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypedConfigService } from '../config/typed-config.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const database = config.get('database', { infer: true });
        return {
          ...database,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
