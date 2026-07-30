import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request, { Response, Test as SuperTest } from 'supertest';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { clearTables } from './test-data-source';

export interface GraphqlError {
  message: string;
  status?: number;
  data?: Array<{ message: string }>;
  extensions?: Record<string, unknown>;
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

export interface AuthSession {
  token: string;
  userId: string;
}

export async function createNestApp(): Promise<{
  app: INestApplication<App>;
  dataSource: DataSource;
}> {
  process.env.PORT = process.env.PORT ?? '8080';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';
  process.env.UPLOAD_PATH = process.env.UPLOAD_PATH ?? 'images';
  process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
  process.env.DB_PORT = process.env.DB_PORT ?? '5432';
  process.env.DB_USER = process.env.DB_USER ?? 'postgres';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
  process.env.DB_DATABASE = process.env.DB_DATABASE ?? 'socialogy';
  process.env.DB_SYNC = '0';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-phase3';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  const uploadPath = process.env.UPLOAD_PATH ?? 'images';
  const imagesDir = join(process.cwd(), uploadPath);
  mkdirSync(imagesDir, { recursive: true });
  app.useStaticAssets(imagesDir, { prefix: `/${uploadPath}` });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );
  await app.init();

  const dataSource = app.get<DataSource>(getDataSourceToken());
  return { app: app, dataSource };
}

export async function resetTables(dataSource: DataSource): Promise<void> {
  await clearTables(dataSource);
}

export function graphqlRequest(
  app: INestApplication<App>,
  query: string,
  variables: Record<string, unknown> = {},
  token: string | null = null,
): SuperTest {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
}

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

export async function createUser(
  app: INestApplication<App>,
  overrides: UserCredentials = {},
): Promise<Response> {
  return graphqlRequest(app, createUserMutation, {
    email: overrides.email ?? 'user@test.com',
    name: overrides.name ?? 'Test User',
    password: overrides.password ?? 'password123',
  });
}

export async function login(
  app: INestApplication<App>,
  overrides: UserCredentials = {},
): Promise<Response> {
  return graphqlRequest(app, loginQuery, {
    email: overrides.email ?? 'user@test.com',
    password: overrides.password ?? 'password123',
  });
}

export async function signupAndLogin(
  app: INestApplication<App>,
  overrides: UserCredentials = {},
): Promise<AuthSession> {
  const signupRes = await createUser(app, overrides);
  const signupBody = signupRes.body as GraphqlResponse<{
    createUser: { _id: string };
  }>;
  expect(signupBody.errors).toBeUndefined();

  const loginRes = await login(app, {
    email: overrides.email ?? 'user@test.com',
    password: overrides.password ?? 'password123',
  });
  const loginBody = loginRes.body as GraphqlResponse<{
    login: AuthSession;
  }>;
  expect(loginBody.errors).toBeUndefined();

  return loginBody.data!.login;
}

export async function createTokenForMissingUser(
  app: INestApplication<App>,
  dataSource: DataSource,
): Promise<string> {
  const { token, userId } = await signupAndLogin(app, {
    email: `missing-${Date.now()}@test.com`,
  });
  await dataSource.query('DELETE FROM "users" WHERE id = $1', [userId]);
  return token;
}

export interface PostOverrides {
  title?: string;
  content?: string;
  imageUrl?: string;
}

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

export async function createPost(
  app: INestApplication<App>,
  token: string | null,
  overrides: PostOverrides = {},
): Promise<Response> {
  return graphqlRequest(
    app,
    createPostMutation,
    {
      title: overrides.title ?? 'Test Post Title',
      content: overrides.content ?? 'Test post content here',
      imageUrl: overrides.imageUrl ?? 'images/test-image.jpg',
    },
    token,
  );
}
