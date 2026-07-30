export interface ValidationErrorItem {
  message: string;
}

/**
 * Domain error matching the Express backend AppError contract.
 * GraphQL formatError maps `code` → top-level `status` and `data`.
 */
export class AppError extends Error {
  readonly code: number;
  readonly data?: ValidationErrorItem[];

  constructor(message: string, code = 500, data?: ValidationErrorItem[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.data = data;
  }
}
