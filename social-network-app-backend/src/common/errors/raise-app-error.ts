import { GraphQLError } from 'graphql';
import { AppError, ValidationErrorItem } from './app.error';

/** Throw a GraphQL-native error while preserving AppError for formatError. */
export function raiseAppError(
  message: string,
  code = 500,
  data?: ValidationErrorItem[],
): never {
  const appError = new AppError(message, code, data);
  throw new GraphQLError(message, {
    originalError: appError,
    extensions: {
      status: code,
      data,
    },
  });
}
