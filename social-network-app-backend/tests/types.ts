export interface GraphqlError {
  message: string;
  status?: number;
  data?: Array<{ message: string }>;
}

export interface GraphqlResponse<TData = Record<string, unknown>> {
  data?: TData;
  errors?: GraphqlError[];
}

export interface UserCredentials {
  email?: string;
  name?: string;
  password?: string;
}

export interface PostOverrides {
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
}
