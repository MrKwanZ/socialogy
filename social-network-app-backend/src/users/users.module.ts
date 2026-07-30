import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { UsersResolver } from './users.resolver';
import { PasswordService } from '../auth/password.service';
import { AppConfigModule } from '../config/config.module';
import { TypedConfigService } from '../config/typed-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const auth = config.get('auth', { infer: true })!;
        return {
          secret: auth.jwt.secret,
          signOptions: {
            expiresIn: auth.jwt
              .expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
          },
        };
      },
    }),
  ],
  providers: [UsersService, AuthService, UsersResolver, PasswordService],
  exports: [
    TypeOrmModule,
    UsersService,
    AuthService,
    JwtModule,
    PasswordService,
  ],
})
export class UsersModule {}
