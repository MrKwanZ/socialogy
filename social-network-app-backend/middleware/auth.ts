import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

const auth: RequestHandler = (req, _res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(' ')[1];
  let decodedToken: JwtPayload | undefined;

  try {
    decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
  } catch {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};

export = auth;
