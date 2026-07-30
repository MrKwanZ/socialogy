import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';
import { TypedConfigService } from '../config/typed-config.service';
import { JwtPayload } from './auth.types';
import { AuthenticatedRequest } from './authenticated-request';

/**
 * Mirrors Express auth middleware: sets `isAuth` / `userId` without rejecting.
 * GraphQL resolvers and REST upload check these flags themselves.
 */
@Injectable()
export class OptionalJwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: TypedConfigService,
  ) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    req.isAuth = false;
    req.userId = undefined;
    req.email = undefined;

    const authHeader = req.get('Authorization');
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    try {
      const auth = this.config.get('auth', { infer: true })!;
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: auth.jwt.secret,
      });
      if (payload?.userId) {
        req.isAuth = true;
        req.userId = payload.userId;
        req.email = payload.email;
      }
    } catch {
      // invalid token → unauthenticated
    }

    next();
  }
}
