import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError } from './app.error';

function unwrapOriginalError(error: unknown): unknown {
  if (error instanceof GraphQLError) {
    return error.originalError ?? error;
  }
  return error;
}

/**
 * Preserve the Express/graphql-http error envelope the frontend expects:
 * `{ message, status, data }` on each GraphQL error (not only under extensions).
 */
export function formatGraphqlError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError & { status?: number; data?: AppError['data'] } {
  const original = unwrapOriginalError(error);

  if (original instanceof AppError) {
    return {
      message: original.message || 'An error occurred.',
      locations: formattedError.locations,
      path: formattedError.path,
      status: original.code,
      data: original.data,
    };
  }

  const extensions = formattedError.extensions;
  if (
    extensions &&
    typeof extensions.status === 'number' &&
    typeof formattedError.message === 'string'
  ) {
    return {
      message: formattedError.message || 'An error occurred.',
      locations: formattedError.locations,
      path: formattedError.path,
      status: extensions.status,
      data: extensions.data as AppError['data'],
    };
  }

  return {
    message: formattedError.message || 'An error occurred.',
    locations: formattedError.locations,
    path: formattedError.path,
    status: 500,
  };
}
