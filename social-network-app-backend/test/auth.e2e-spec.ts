import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { App } from 'supertest/types';
import { User } from '../src/users/user.entity';
import {
  AuthSession,
  createNestApp,
  createTokenForMissingUser,
  createUser,
  graphqlRequest,
  GraphqlResponse,
  login,
  resetTables,
  signupAndLogin,
} from './utils/auth-helpers';

describe('Auth flow (Phase 3)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createNestApp());
  });

  beforeEach(async () => {
    await resetTables(dataSource);
  });

  afterEach(async () => {
    await resetTables(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createUser', () => {
    it('creates a user successfully', async () => {
      const res = await createUser(app);

      expect(res.status).toBe(200);
      const body = res.body as GraphqlResponse<{
        createUser: { _id: string; email: string; name: string };
      }>;
      expect(body.errors).toBeUndefined();
      expect(body.data?.createUser.email).toBe('user@test.com');
      expect(body.data?.createUser.name).toBe('Test User');
      expect(body.data?.createUser._id).toBeDefined();
    });

    it('returns 422 when email is invalid', async () => {
      const res = await createUser(app, { email: 'not-an-email' });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
      expect(body.errors?.[0].data).toEqual(
        expect.arrayContaining([{ message: 'E-Mail is invalid.' }]),
      );
    });

    it('returns 422 when password is too short', async () => {
      const res = await createUser(app, { password: '1234' });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
      expect(body.errors?.[0].data).toEqual(
        expect.arrayContaining([{ message: 'Password too short!' }]),
      );
    });

    it('returns error when user already exists', async () => {
      await createUser(app);
      const res = await createUser(app);
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('User exists already!');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await createUser(app);
    });

    it('logs in successfully', async () => {
      const res = await login(app);
      const body = res.body as GraphqlResponse<{
        login: { token: string; userId: string };
      }>;

      expect(res.status).toBe(200);
      expect(body.errors).toBeUndefined();
      expect(body.data?.login.token).toBeDefined();
      expect(body.data?.login.userId).toBeDefined();
    });

    it('returns 401 when user is not found', async () => {
      const res = await login(app, { email: 'missing@test.com' });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('User not found.');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 401 when password is incorrect', async () => {
      const res = await login(app, { password: 'wrongpassword' });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Password is incorrect.');
      expect(body.errors?.[0].status).toBe(401);
    });
  });

  describe('user query', () => {
    it('returns authenticated user status', async () => {
      const { token } = await signupAndLogin(app);

      const res = await graphqlRequest(
        app,
        `{ user { _id email status } }`,
        {},
        token,
      );
      const body = res.body as GraphqlResponse<{
        user: { email: string; status: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.user.email).toBe('user@test.com');
      expect(body.data?.user.status).toBe('I am new!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(app, `{ user { _id email status } }`);
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 404 when user no longer exists', async () => {
      const token = await createTokenForMissingUser(app, dataSource);

      const res = await graphqlRequest(
        app,
        `{ user { _id email status } }`,
        {},
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('No user found!');
      expect(body.errors?.[0].status).toBe(404);
    });
  });

  describe('updateStatus', () => {
    it('updates user status successfully', async () => {
      const { token } = await signupAndLogin(app);

      const res = await graphqlRequest(
        app,
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Feeling great!' },
        token,
      );
      const body = res.body as GraphqlResponse<{
        updateStatus: { status: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.updateStatus.status).toBe('Feeling great!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Test' },
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 404 when user no longer exists', async () => {
      const token = await createTokenForMissingUser(app, dataSource);

      const res = await graphqlRequest(
        app,
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Test' },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('No user found!');
      expect(body.errors?.[0].status).toBe(404);
    });
  });

  describe('JWT and password contracts', () => {
    it('issues a token with userId, email, and ~1h expiry', async () => {
      await createUser(app);
      const res = await login(app);
      const body = res.body as GraphqlResponse<{ login: AuthSession }>;

      expect(body.errors).toBeUndefined();
      const decoded = jwt.verify(
        body.data!.login.token,
        process.env.JWT_SECRET as string,
      ) as jwt.JwtPayload & { userId: string; email: string };

      expect(decoded.userId).toBe(body.data!.login.userId);
      expect(decoded.email).toBe('user@test.com');
      const lifetimeSeconds = (decoded.exp as number) - (decoded.iat as number);
      expect(lifetimeSeconds).toBe(3600);
    });

    it('stores bcryptjs cost-12 hashes and accepts pre-hashed login', async () => {
      const createRes = await createUser(app, { password: 'password123' });
      const createBody = createRes.body as GraphqlResponse<{
        createUser: { _id: string };
      }>;
      const user = await dataSource.getRepository(User).findOneByOrFail({
        id: createBody.data!.createUser._id,
      });
      expect(user.password).toMatch(/^\$2[aby]\$12\$/);

      const plainPassword = 'migrated-pass';
      const hashedPw = await bcrypt.hash(plainPassword, 12);
      await dataSource.getRepository(User).save(
        dataSource.getRepository(User).create({
          email: 'migrated@test.com',
          name: 'Migrated User',
          password: hashedPw,
        }),
      );

      const loginRes = await login(app, {
        email: 'migrated@test.com',
        password: plainPassword,
      });
      const loginBody = loginRes.body as GraphqlResponse<{
        login: AuthSession;
      }>;
      expect(loginBody.errors).toBeUndefined();
      expect(loginBody.data?.login.token).toBeDefined();
    });
  });
});
