import 'express';

declare global {
  namespace Express {
    interface Request {
      isAuth: boolean;
      userId?: string;
    }
  }
}

export {};
