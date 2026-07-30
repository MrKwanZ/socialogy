import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { GqlContext, JwtPayload } from './auth.types';

export function createGqlContext(
  req: Request,
  jwtService: JwtService,
  jwtSecret: string,
): GqlContext {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return { isAuth: false };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { isAuth: false };
  }

  try {
    const payload = jwtService.verify<JwtPayload>(token, {
      secret: jwtSecret,
    });
    if (!payload?.userId) {
      return { isAuth: false };
    }
    return {
      isAuth: true,
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return { isAuth: false };
  }
}
