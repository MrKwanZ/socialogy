import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  isAuth: boolean;
  userId?: string;
  email?: string;
}
