import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import {
  createNestApp,
  createPost,
  createTokenForMissingUser,
  graphqlRequest,
  GraphqlResponse,
  resetTables,
  signupAndLogin,
} from './utils/auth-helpers';

describe('Feed CRUD (Phase 4)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let token: string;
  let postId: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createNestApp());
  });

  beforeEach(async () => {
    await resetTables(dataSource);
    const auth = await signupAndLogin(app);
    token = auth.token;

    const postRes = await createPost(app, token);
    const postBody = postRes.body as GraphqlResponse<{
      createPost: { _id: string };
    }>;
    expect(postBody.errors).toBeUndefined();
    postId = postBody.data!.createPost._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createPost', () => {
    it('creates a post successfully', async () => {
      const res = await createPost(app, token, {
        title: 'Another Post',
        content: 'More content here',
      });
      const body = res.body as GraphqlResponse<{
        createPost: { title: string; content: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.createPost.title).toBe('Another Post');
      expect(body.data?.createPost.content).toBe('More content here');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await createPost(app, null);
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 401 when user does not exist', async () => {
      const fakeToken = await createTokenForMissingUser(app, dataSource);
      const res = await createPost(app, fakeToken);
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid user.');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 422 when title is invalid', async () => {
      const res = await createPost(app, token, {
        title: 'bad',
        content: 'valid content',
      });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
      expect(body.errors?.[0].data).toEqual(
        expect.arrayContaining([{ message: 'Title is invalid.' }]),
      );
    });

    it('returns 422 when content is invalid', async () => {
      const res = await createPost(app, token, {
        title: 'Valid Title',
        content: 'bad',
      });
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
      expect(body.errors?.[0].data).toEqual(
        expect.arrayContaining([{ message: 'Content is invalid.' }]),
      );
    });
  });

  describe('posts query with pagination', () => {
    it('returns paginated posts sorted by createdAt descending', async () => {
      await createPost(app, token, {
        title: 'Second Post',
        content: 'Second content',
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      await createPost(app, token, {
        title: 'Third Post',
        content: 'Third content',
      });

      const pageOne = await graphqlRequest(
        app,
        `query FetchPosts($page: Int) {
          posts(page: $page) {
            posts { _id title }
            totalPosts
          }
        }`,
        { page: 1 },
        token,
      );
      const pageOneBody = pageOne.body as GraphqlResponse<{
        posts: { posts: Array<{ title: string }>; totalPosts: number };
      }>;

      expect(pageOneBody.errors).toBeUndefined();
      expect(pageOneBody.data?.posts.posts).toHaveLength(2);
      expect(pageOneBody.data?.posts.totalPosts).toBe(3);
      expect(pageOneBody.data?.posts.posts[0].title).toBe('Third Post');

      const pageTwo = await graphqlRequest(
        app,
        `query FetchPosts($page: Int) {
          posts(page: $page) {
            posts { _id title }
            totalPosts
          }
        }`,
        { page: 2 },
        token,
      );
      const pageTwoBody = pageTwo.body as GraphqlResponse<{
        posts: { posts: unknown[] };
      }>;

      expect(pageTwoBody.errors).toBeUndefined();
      expect(pageTwoBody.data?.posts.posts).toHaveLength(1);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        app,
        `{
        posts(page: 1) {
          posts { _id }
          totalPosts
        }
      }`,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });
  });

  describe('post query (single post)', () => {
    it('returns a single post successfully', async () => {
      const res = await graphqlRequest(
        app,
        `query FetchPost($id: ID!) {
          post(id: $id) {
            _id
            title
            content
            creator { name }
          }
        }`,
        { id: postId },
        token,
      );
      const body = res.body as GraphqlResponse<{
        post: { _id: string; title: string; creator: { name: string } };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.post._id).toBe(postId);
      expect(body.data?.post.title).toBe('Test Post Title');
      expect(body.data?.post.creator.name).toBe('Test User');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        app,
        `query FetchPost($id: ID!) {
          post(id: $id) { _id title }
        }`,
        { id: postId },
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        app,
        `query FetchPost($id: ID!) {
          post(id: $id) { _id title }
        }`,
        { id: '507f1f77bcf86cd799439011' },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('No post found!');
      expect(body.errors?.[0].status).toBe(404);
    });
  });

  describe('updatePost', () => {
    it('updates a post successfully', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
            title
            content
          }
        }`,
        {
          id: postId,
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg',
        },
        token,
      );
      const body = res.body as GraphqlResponse<{
        updatePost: { title: string; content: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.updatePost.title).toBe('Updated Title');
      expect(body.data?.updatePost.content).toBe('Updated content here');
    });

    it('keeps imageUrl when sentinel string "undefined" is sent', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            imageUrl
            title
          }
        }`,
        {
          id: postId,
          title: 'Updated Title Here',
          content: 'Updated content here',
          imageUrl: 'undefined',
        },
        token,
      );
      const body = res.body as GraphqlResponse<{
        updatePost: { imageUrl: string; title: string };
      }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.updatePost.title).toBe('Updated Title Here');
      expect(body.data?.updatePost.imageUrl).toBe('images/test-image.jpg');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg',
        },
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: '507f1f77bcf86cd799439011',
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg',
        },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('No post found!');
      expect(body.errors?.[0].status).toBe(404);
    });

    it('returns 403 when user is not the creator', async () => {
      const otherUser = await signupAndLogin(app, {
        email: 'other@test.com',
        name: 'Other User',
      });

      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg',
        },
        otherUser.token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authorized!');
      expect(body.errors?.[0].status).toBe(403);
    });

    it('returns 422 when title is invalid', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'bad',
          content: 'Valid content here',
          imageUrl: 'images/test-image.jpg',
        },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
    });

    it('returns 422 when content is invalid', async () => {
      const res = await graphqlRequest(
        app,
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Valid Title',
          content: 'bad',
          imageUrl: 'images/test-image.jpg',
        },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Invalid input.');
      expect(body.errors?.[0].status).toBe(422);
    });
  });

  describe('deletePost', () => {
    it('deletes a post successfully', async () => {
      const res = await graphqlRequest(
        app,
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId },
        token,
      );
      const body = res.body as GraphqlResponse<{ deletePost: boolean }>;

      expect(body.errors).toBeUndefined();
      expect(body.data?.deletePost).toBe(true);

      const fetchRes = await graphqlRequest(
        app,
        `query FetchPost($id: ID!) {
          post(id: $id) { _id }
        }`,
        { id: postId },
        token,
      );
      const fetchBody = fetchRes.body as GraphqlResponse;

      expect(fetchBody.errors?.[0].message).toBe('No post found!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        app,
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId },
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authenticated!');
      expect(body.errors?.[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        app,
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: '507f1f77bcf86cd799439011' },
        token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('No post found!');
      expect(body.errors?.[0].status).toBe(404);
    });

    it('returns 403 when user is not the creator', async () => {
      const otherUser = await signupAndLogin(app, {
        email: 'other@test.com',
        name: 'Other User',
      });

      const res = await graphqlRequest(
        app,
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId },
        otherUser.token,
      );
      const body = res.body as GraphqlResponse;

      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].message).toBe('Not authorized!');
      expect(body.errors?.[0].status).toBe(403);
    });
  });
});
