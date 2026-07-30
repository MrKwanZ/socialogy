export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Optional JWT context (`isAuth` / `userId`).
 */
export interface GqlContext {
  isAuth: boolean;
  userId?: string;
  email?: string;
}
