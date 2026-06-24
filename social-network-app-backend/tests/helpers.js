const request = require('supertest');
const User = require('../models/user');

const app = () => global.app;

const graphqlRequest = (query, variables = {}, token = null) => {
  const req = request(app()).post('/graphql').send({ query, variables });

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

const createUser = async ({
  email = 'user@test.com',
  name = 'Test User',
  password = 'password123'
} = {}) => {
  const res = await graphqlRequest(createUserMutation, { email, name, password });
  return res;
};

const login = async ({
  email = 'user@test.com',
  password = 'password123'
} = {}) => {
  const res = await graphqlRequest(loginQuery, { email, password });
  return res;
};

const signupAndLogin = async (overrides = {}) => {
  const signupRes = await createUser(overrides);
  expect(signupRes.body.errors).toBeUndefined();

  const loginRes = await login({
    email: overrides.email || 'user@test.com',
    password: overrides.password || 'password123'
  });
  expect(loginRes.body.errors).toBeUndefined();

  return {
    token: loginRes.body.data.login.token,
    userId: loginRes.body.data.login.userId
  };
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

const createPost = async (token, overrides = {}) => {
  const res = await graphqlRequest(
    createPostMutation,
    {
      title: overrides.title || 'Test Post Title',
      content: overrides.content || 'Test post content here',
      imageUrl: overrides.imageUrl || 'images/test-image.jpg'
    },
    token
  );
  return res;
};

const createTokenForMissingUser = async () => {
  const { token, userId } = await signupAndLogin({
    email: `missing-${Date.now()}@test.com`
  });
  await User.findByIdAndDelete(userId);
  return token;
};

const minimalJpegBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
  'base64'
);

module.exports = {
  app,
  graphqlRequest,
  createUser,
  login,
  signupAndLogin,
  createPost,
  createTokenForMissingUser,
  minimalJpegBuffer
};
