import type { GraphqlError } from '../types/graphql';

type ErrorContext = 'login' | 'signup' | 'post' | 'generic';

export function getGraphqlErrorMessage(
  errors: GraphqlError[] | undefined,
  context: ErrorContext = 'generic',
  fallback = 'Something went wrong. Please try again!'
): string {
  if (!errors?.length) {
    return fallback;
  }

  const err = errors[0];

  if (context === 'login' && err.status === 401) {
    return 'Invalid credentials, try again!';
  }

  if (err.status === 422 && err.data?.length) {
    return err.data.map((item) => item.message).join(' ');
  }

  if (context === 'signup' && err.message.includes('exists')) {
    return "Validation failed. Make sure the email address isn't used yet!";
  }

  if (err.message) {
    return err.message;
  }

  return fallback;
}
