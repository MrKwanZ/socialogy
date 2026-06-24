const {
  graphqlRequest,
  createUser,
  login,
  signupAndLogin,
  createTokenForMissingUser
} = require('./helpers');

describe('Auth flow', () => {
  describe('createUser', () => {
    it('creates a user successfully', async () => {
      const res = await createUser();

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createUser.email).toBe('user@test.com');
      expect(res.body.data.createUser.name).toBe('Test User');
      expect(res.body.data.createUser._id).toBeDefined();
    });

    it('returns 422 when email is invalid', async () => {
      const res = await createUser({ email: 'not-an-email' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
      expect(res.body.errors[0].data).toEqual(
        expect.arrayContaining([{ message: 'E-Mail is invalid.' }])
      );
    });

    it('returns 422 when password is too short', async () => {
      const res = await createUser({ password: '1234' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Invalid input.');
      expect(res.body.errors[0].status).toBe(422);
      expect(res.body.errors[0].data).toEqual(
        expect.arrayContaining([{ message: 'Password too short!' }])
      );
    });

    it('returns error when user already exists', async () => {
      await createUser();
      const res = await createUser();

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('User exists already!');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await createUser();
    });

    it('logs in successfully', async () => {
      const res = await login();

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.login.token).toBeDefined();
      expect(res.body.data.login.userId).toBeDefined();
    });

    it('returns 401 when user is not found', async () => {
      const res = await login({ email: 'missing@test.com' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('User not found.');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 401 when password is incorrect', async () => {
      const res = await login({ password: 'wrongpassword' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Password is incorrect.');
      expect(res.body.errors[0].status).toBe(401);
    });
  });

  describe('user query', () => {
    it('returns authenticated user status', async () => {
      const { token } = await signupAndLogin();

      const res = await graphqlRequest(
        `{ user { _id email status } }`,
        {},
        token
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.user.email).toBe('user@test.com');
      expect(res.body.data.user.status).toBe('I am new!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(`{ user { _id email status } }`);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 404 when user no longer exists', async () => {
      const token = await createTokenForMissingUser();

      const res = await graphqlRequest(
        `{ user { _id email status } }`,
        {},
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('No user found!');
      expect(res.body.errors[0].status).toBe(404);
    });
  });

  describe('updateStatus', () => {
    it('updates user status successfully', async () => {
      const { token } = await signupAndLogin();

      const res = await graphqlRequest(
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Feeling great!' },
        token
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateStatus.status).toBe('Feeling great!');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await graphqlRequest(
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Test' }
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('Not authenticated!');
      expect(res.body.errors[0].status).toBe(401);
    });

    it('returns 404 when user no longer exists', async () => {
      const token = await createTokenForMissingUser();

      const res = await graphqlRequest(
        `mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) { status }
        }`,
        { status: 'Test' },
        token
      );

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toBe('No user found!');
      expect(res.body.errors[0].status).toBe(404);
    });
  });
});
