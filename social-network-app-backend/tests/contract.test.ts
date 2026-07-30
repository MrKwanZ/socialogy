import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import {
  app,
  graphqlRequest,
  createUser,
  login,
  signupAndLogin,
  createPost
} from './helpers';
import { GraphqlResponse } from './types';

describe('Compatibility contracts (Phase 0 freeze)', () => {
  describe('JWT claims and expiry', () => {
    it('issues a token with userId, email, and ~1h expiry', async () => {
      await createUser();
      const res = await login();
      const body = res.body as GraphqlResponse<{
        login: { token: string; userId: string };
      }>;

      expect(body.errors).toBeUndefined();
      const token = body.data!.login.token;
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload & { userId: string; email: string };

      expect(decoded.userId).toBe(body.data!.login.userId);
      expect(decoded.email).toBe('user@test.com');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const lifetimeSeconds = (decoded.exp as number) - (decoded.iat as number);
      expect(lifetimeSeconds).toBe(3600);
    });
  });

  describe('bcryptjs cost-12 password compatibility', () => {
    it('stores hashes with cost factor 12', async () => {
      await createUser({ password: 'password123' });
      const user = await User.findOne({ email: 'user@test.com' });

      expect(user).not.toBeNull();
      expect(user!.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('accepts login against a pre-hashed bcryptjs cost-12 password', async () => {
      const plainPassword = 'migrated-pass';
      const hashedPw = await bcrypt.hash(plainPassword, 12);

      await User.create({
        email: 'migrated@test.com',
        name: 'Migrated User',
        password: hashedPw
      });

      const res = await login({
        email: 'migrated@test.com',
        password: plainPassword
      });
      const body = res.body as GraphqlResponse<{
        login: { token: string; userId: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.login.token).toBeDefined();
      expect(body.data?.login.userId).toBeDefined();
    });
  });

  describe('GraphQL error envelope', () => {
    it('exposes message, status, and data on validation errors', async () => {
      const res = await createUser({
        email: 'not-an-email',
        password: '1234'
      });
      const body = res.body as GraphqlResponse;
      const error = body.errors?.[0];

      expect(error).toBeDefined();
      expect(error?.message).toBe('Invalid input.');
      expect(error?.status).toBe(422);
      expect(error?.data).toEqual(
        expect.arrayContaining([
          { message: 'E-Mail is invalid.' },
          { message: 'Password too short!' }
        ])
      );
    });
  });

  describe('createUser defaults', () => {
    it('sets default status to "I am new!"', async () => {
      const { token } = await signupAndLogin();
      const res = await graphqlRequest(
        `{ user { status } }`,
        {},
        token
      );
      const body = res.body as GraphqlResponse<{
        user: { status: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.user.status).toBe('I am new!');
    });
  });

  describe('posts ordering', () => {
    it('returns posts sorted by createdAt descending', async () => {
      const { token } = await signupAndLogin();

      await createPost(token, {
        title: 'Oldest Post Title',
        content: 'Oldest post content'
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      await createPost(token, {
        title: 'Newest Post Title',
        content: 'Newest post content'
      });

      const res = await graphqlRequest(
        `{
          posts(page: 1) {
            posts { title createdAt }
            totalPosts
          }
        }`,
        {},
        token
      );
      const body = res.body as GraphqlResponse<{
        posts: {
          posts: Array<{ title: string; createdAt: string }>;
          totalPosts: number;
        };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.posts.totalPosts).toBe(2);
      expect(body.data?.posts.posts[0].title).toBe('Newest Post Title');
      expect(body.data?.posts.posts[1].title).toBe('Oldest Post Title');

      const newest = Date.parse(body.data!.posts.posts[0].createdAt);
      const oldest = Date.parse(body.data!.posts.posts[1].createdAt);
      expect(newest).toBeGreaterThanOrEqual(oldest);
    });
  });

  describe('updatePost imageUrl sentinel', () => {
    it('keeps the existing imageUrl when postInput.imageUrl is the string "undefined"', async () => {
      const { token } = await signupAndLogin();
      const createRes = await createPost(token, {
        imageUrl: 'images/original.jpg'
      });
      const createBody = createRes.body as GraphqlResponse<{
        createPost: { _id: string; imageUrl: string };
      }>;
      const postId = createBody.data!.createPost._id;

      const updateRes = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
            imageUrl
            title
          }
        }`,
        {
          id: postId,
          title: 'Updated Title Here',
          content: 'Updated content here',
          imageUrl: 'undefined'
        },
        token
      );
      const updateBody = updateRes.body as GraphqlResponse<{
        updatePost: { imageUrl: string; title: string };
      }>;

      expect(updateBody.errors).toBeUndefined();
      expect(updateBody.data?.updatePost.title).toBe('Updated Title Here');
      expect(updateBody.data?.updatePost.imageUrl).toBe('images/original.jpg');
    });
  });

  describe('CORS', () => {
    it('responds to OPTIONS with the frozen CORS headers', async () => {
      const res = await request(app()).options('/graphql');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-methods']).toBe(
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
      );
      expect(res.headers['access-control-allow-headers']).toBe(
        'Content-Type, Authorization'
      );
    });

    it('includes CORS headers on GraphQL responses', async () => {
      const res = await graphqlRequest(`{ __typename }`);

      expect(res.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('upload filePath format', () => {
    it('stores uploaded files as images/<uuid>-.jpg', async () => {
      const { token } = await signupAndLogin();
      const jpeg = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
        'base64'
      );

      const res = await request(app())
        .put('/post-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', jpeg, 'photo.png');

      expect(res.status).toBe(201);
      expect(res.body.filePath).toMatch(
        /^images\/[0-9a-f-]{36}-\.jpg$/i
      );
    });
  });
});
