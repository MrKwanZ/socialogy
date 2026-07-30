export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Optional JWT context — mirrors Express auth middleware (`isAuth` flag).
 */
export interface GqlContext {
  isAuth: boolean;
  userId?: string;
  email?: string;
}
