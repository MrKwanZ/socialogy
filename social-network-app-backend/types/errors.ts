export interface ValidationError {
  message: string;
}

export class AppError extends Error {
  code: number;
  data?: ValidationError[];

  constructor(message: string, code = 500, data?: ValidationError[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.data = data;
  }
}
