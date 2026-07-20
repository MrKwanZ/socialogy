import request, { Response, Test } from 'supertest';
import User from '../models/user';
import {
  AuthSession,
  GraphqlResponse,
  PostOverrides,
  UserCredentials
} from './types';

const getApp = () => global.app;

export const graphqlRequest = (
  query: string,
  variables: Record<string, unknown> = {},
  token: string | null = null
): Test => {
  const req = request(getApp())
    .post('/graphql')
    .send({ query, variables });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

const createUserMutation = `
  mutation CreateUser($email: String!, $name: String!, $password: String!) {
    createUser(userInput: { email: $email, name: $name, password: $password }) {
      _id
      email
      name
    }
  }
`;

const loginQuery = `
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      userId
    }
  }
`;

export const createUser = async (
  overrides: UserCredentials = {}
): Promise<Response> => {
  const email = overrides.email ?? 'user@test.com';
  const name = overrides.name ?? 'Test User';
  const password = overrides.password ?? 'password123';

  return graphqlRequest(createUserMutation, { email, name, password });
};

export const login = async (
  overrides: UserCredentials = {}
): Promise<Response> => {
  const email = overrides.email ?? 'user@test.com';
  const password = overrides.password ?? 'password123';

  return graphqlRequest(loginQuery, { email, password });
};

export const signupAndLogin = async (
  overrides: UserCredentials = {}
): Promise<AuthSession> => {
  const signupRes = await createUser(overrides);
  const signupBody = signupRes.body as GraphqlResponse<{
    createUser: { _id: string };
  }>;
  expect(signupBody.errors).toBeUndefined();

  const loginRes = await login({
    email: overrides.email ?? 'user@test.com',
    password: overrides.password ?? 'password123'
  });
  const loginBody = loginRes.body as GraphqlResponse<{
    login: AuthSession;
  }>;
  expect(loginBody.errors).toBeUndefined();

  return loginBody.data!.login;
};

const createPostMutation = `
  mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
    createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
      _id
      title
      content
      imageUrl
    }
  }
`;

export const createPost = async (
  token: string | null,
  overrides: PostOverrides = {}
): Promise<Response> => {
  return graphqlRequest(
    createPostMutation,
    {
      title: overrides.title ?? 'Test Post Title',
      content: overrides.content ?? 'Test post content here',
      imageUrl: overrides.imageUrl ?? 'images/test-image.jpg'
    },
    token
  );
};

export const createTokenForMissingUser = async (): Promise<string> => {
  const { token, userId } = await signupAndLogin({
    email: `missing-${Date.now()}@test.com`
  });
  await User.findByIdAndDelete(userId);
  return token;
};

export const minimalJpegBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
  'base64'
);

export const app = getApp;
