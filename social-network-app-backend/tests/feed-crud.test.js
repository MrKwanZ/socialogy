const request = require('supertest');
const {
  app,
  graphqlRequest,
  signupAndLogin,
  createPost,
  createTokenForMissingUser,
  minimalJpegBuffer
} = require('./helpers');

describe('Feed CRUD', () => {
  let token;
  let userId;
  let postId;

  beforeEach(async () => {
    const auth = await signupAndLogin();
    token = auth.token;
    userId = auth.userId;

    const postRes = await createPost(token);
    expect(postRes.body.errors).toBeUndefined();
    postId = postRes.body.data.createPost._id;
  });

  describe('createPost', () => {
    it('creates a post successfully', async () => {
      const res = await createPost(token, {
        title: 'Another Post',
        content: 'More content here'
      });

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createPost.title).toBe('Another Post');
      expect(res.body.data.createPost.content).toBe('More content here');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await createPost(null);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 401 when user does not exist', async () => {
      const fakeToken = await createTokenForMissingUser();
      const res = await createPost(fakeToken);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid user.');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 422 when title is invalid', async () => {
      const res = await createPost(token, { title: 'bad', content: 'valid content' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
      expect(res.body.errors[0].data).toEqual(
        expect.arrayContaining([{ message: 'Title is invalid.' }])
      );
    });

    it('returns 422 when content is invalid', async () => {
      const res = await createPost(token, {
        title: 'Valid Title',
        content: 'bad'
      });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
      expect(res.body.errors[0].data).toEqual(
        expect.arrayContaining([{ message: 'Content is invalid.' }])
      );
    });
  });

  describe('posts query with pagination', () => {
    it('returns paginated posts', async () => {
      await createPost(token, { title: 'Second Post', content: 'Second content' });
      await createPost(token, { title: 'Third Post', content: 'Third content' });

      const pageOne = await graphqlRequest(
        `query FetchPosts($page: Int) {
          posts(page: $page) {
            posts { _id title }
            totalPosts
          }
        }`,
        { page: 1 },
        token
      );

      expect(pageOne.body.errors).toBeUndefined();
      expect(pageOne.body.data.posts.posts).toHaveLength(2);
      expect(pageOne.body.data.posts.totalPosts).toBe(3);

      const pageTwo = await graphqlRequest(
        `query FetchPosts($page: Int) {
          posts(page: $page) {
            posts { _id title }
            totalPosts
          }
        }`,
        { page: 2 },
        token
      );

      expect(pageTwo.body.errors).toBeUndefined();
      expect(pageTwo.body.data.posts.posts).toHaveLength(1);
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(`{
        posts(page: 1) {
          posts { _id }
          totalPosts
        }
      }`);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });
  });

  describe('post query (single post)', () => {
    it('returns a single post successfully', async () => {
      const res = await graphqlRequest(
        `query FetchPost($id: ID!) {
          post(id: $id) {
            _id
            title
            content
            creator { name }
          }
        }`,
        { id: postId },
        token
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.post._id).toBe(postId);
      expect(res.body.data.post.title).toBe('Test Post Title');
      expect(res.body.data.post.creator.name).toBe('Test User');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        `query FetchPost($id: ID!) {
          post(id: $id) { _id title }
        }`,
        { id: postId }
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        `query FetchPost($id: ID!) {
          post(id: $id) { _id title }
        }`,
        { id: '507f1f77bcf86cd799439011' },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('No post found!');
      expect(res.body.errors[0].status).toBe(404);
    });
  });

  describe('updatePost', () => {
    it('updates a post successfully', async () => {
      const res = await graphqlRequest(
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
          imageUrl: 'images/test-image.jpg'
        },
        token
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updatePost.title).toBe('Updated Title');
      expect(res.body.data.updatePost.content).toBe('Updated content here');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg'
        }
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: '507f1f77bcf86cd799439011',
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg'
        },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('No post found!');
      expect(res.body.errors[0].status).toBe(404);
    });

    it('returns 403 when user is not the creator', async () => {
      const otherUser = await signupAndLogin({
        email: 'other@test.com',
        name: 'Other User'
      });

      const res = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Updated Title',
          content: 'Updated content here',
          imageUrl: 'images/test-image.jpg'
        },
        otherUser.token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authorized!');
      expect(res.body.errors[0].status).toBe(403);
    });

    it('returns 422 when title is invalid', async () => {
      const res = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'bad',
          content: 'Valid content here',
          imageUrl: 'images/test-image.jpg'
        },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
    });

    it('returns 422 when content is invalid', async () => {
      const res = await graphqlRequest(
        `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
          updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
          }
        }`,
        {
          id: postId,
          title: 'Valid Title',
          content: 'bad',
          imageUrl: 'images/test-image.jpg'
        },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
    });
  });

  describe('deletePost', () => {
    it('deletes a post successfully', async () => {
      const res = await graphqlRequest(
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId },
        token
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deletePost).toBe(true);

      const fetchRes = await graphqlRequest(
        `query FetchPost($id: ID!) {
          post(id: $id) { _id }
        }`,
        { id: postId },
        token
      );

      expect(fetchRes.body.errors[0].message).toBe('No post found!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId }
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 404 when post is not found', async () => {
      const res = await graphqlRequest(
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: '507f1f77bcf86cd799439011' },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('No post found!');
      expect(res.body.errors[0].status).toBe(404);
    });

    it('returns 403 when user is not the creator', async () => {
      const otherUser = await signupAndLogin({
        email: 'other@test.com',
        name: 'Other User'
      });

      const res = await graphqlRequest(
        `mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }`,
        { id: postId },
        otherUser.token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authorized!');
      expect(res.body.errors[0].status).toBe(403);
    });
  });

  describe('post-image upload', () => {
    it('uploads an image successfully', async () => {
      const res = await request(app())
        .put('/post-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', minimalJpegBuffer, 'test.jpg');

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('File stored.');
      expect(res.body.filePath).toMatch(/^images\//);
    });

    it('returns message when no file is provided', async () => {
      const res = await request(app())
        .put('/post-image')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('No file provided!');
    });

    it('returns error when not authenticated', async () => {
      const res = await request(app())
        .put('/post-image')
        .attach('image', minimalJpegBuffer, 'test.jpg');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Not authenticated!');
    });
  });
});
