import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { User, DEFAULT_USER_STATUS } from '../src/users/user.entity';
import { Post } from '../src/posts/post.entity';
import {
  clearTables,
  createTestDataSource,
  resetSchema,
} from './utils/test-data-source';

describe('Schema repositories (e2e)', () => {
  let dataSource: DataSource;
  let users: Repository<User>;
  let posts: Repository<Post>;

  beforeAll(async () => {
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5432';
    process.env.DB_USER = process.env.DB_USER ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
    process.env.DB_DATABASE = process.env.DB_DATABASE ?? 'socialogy';

    dataSource = createTestDataSource();
    await dataSource.initialize();
    await resetSchema(dataSource);
    users = dataSource.getRepository(User);
    posts = dataSource.getRepository(Post);
  });

  afterEach(async () => {
    await clearTables(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  async function createUser(overrides: Partial<User> = {}): Promise<User> {
    const user = users.create({
      email: overrides.email ?? 'user@test.com',
      password: overrides.password ?? '$2a$12$testhashplaceholderxxxxxxxxxxxx',
      name: overrides.name ?? 'Test User',
      status: overrides.status,
      legacyMongoId: overrides.legacyMongoId ?? null,
    });
    return users.save(user);
  }

  it('creates a user with UUID id and default status', async () => {
    const user = await createUser();

    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(user.status).toBe(DEFAULT_USER_STATUS);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('normalizes email to lowercase and enforces uniqueness', async () => {
    await createUser({ email: 'Alice@Example.COM' });
    const stored = await users.findOneByOrFail({ email: 'alice@example.com' });
    expect(stored.email).toBe('alice@example.com');

    await expect(
      createUser({ email: 'ALICE@example.com', name: 'Dup' }),
    ).rejects.toBeInstanceOf(QueryFailedError);
  });

  it('stores unique nullable legacy_mongo_id on users', async () => {
    await createUser({
      email: 'a@test.com',
      legacyMongoId: '507f1f77bcf86cd799439011',
    });
    await createUser({ email: 'b@test.com', legacyMongoId: null });
    await createUser({ email: 'c@test.com', legacyMongoId: null });

    await expect(
      createUser({
        email: 'd@test.com',
        legacyMongoId: '507f1f77bcf86cd799439011',
      }),
    ).rejects.toBeInstanceOf(QueryFailedError);
  });

  it('links posts to creators and loads the relation', async () => {
    const creator = await createUser();
    const post = await posts.save(
      posts.create({
        title: 'Hello World Post',
        content: 'Some content here',
        imageUrl: 'images/test.jpg',
        creatorId: creator.id,
      }),
    );

    const loaded = await posts.findOneOrFail({
      where: { id: post.id },
      relations: { creator: true },
    });

    expect(loaded.creator.id).toBe(creator.id);
    expect(loaded.creator.email).toBe('user@test.com');
    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects posts with a missing creator (FK)', async () => {
    await expect(
      posts.save(
        posts.create({
          title: 'Orphan Post Title',
          content: 'Should fail FK check',
          imageUrl: 'images/x.jpg',
          creatorId: '00000000-0000-4000-8000-000000000000',
        }),
      ),
    ).rejects.toBeInstanceOf(QueryFailedError);
  });

  it('restricts deleting a user that still has posts', async () => {
    const creator = await createUser();
    await posts.save(
      posts.create({
        title: 'Owned Post Title',
        content: 'Owned post content',
        imageUrl: 'images/owned.jpg',
        creatorId: creator.id,
      }),
    );

    await expect(users.delete(creator.id)).rejects.toBeInstanceOf(
      QueryFailedError,
    );

    await posts.delete({ creatorId: creator.id });
    await users.delete(creator.id);
    expect(await users.count()).toBe(0);
  });

  it('orders feed posts by createdAt descending', async () => {
    const creator = await createUser();

    const older = await posts.save(
      posts.create({
        title: 'Older Post Title',
        content: 'Older content here',
        imageUrl: 'images/old.jpg',
        creatorId: creator.id,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 25));

    const newer = await posts.save(
      posts.create({
        title: 'Newer Post Title',
        content: 'Newer content here',
        imageUrl: 'images/new.jpg',
        creatorId: creator.id,
      }),
    );

    const page = await posts.find({
      order: { createdAt: 'DESC' },
      take: 2,
    });

    expect(page.map((p) => p.id)).toEqual([newer.id, older.id]);
    expect(page[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      page[1].createdAt.getTime(),
    );
  });

  it('supports transactional create of user + post', async () => {
    await dataSource.transaction(async (manager) => {
      const user = await manager.save(
        manager.create(User, {
          email: 'tx@test.com',
          password: 'hash',
          name: 'Tx User',
        }),
      );
      await manager.save(
        manager.create(Post, {
          title: 'Tx Post Title',
          content: 'Tx post content',
          imageUrl: 'images/tx.jpg',
          creatorId: user.id,
        }),
      );
    });

    expect(await users.count()).toBe(1);
    expect(await posts.count()).toBe(1);

    await expect(
      dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            email: 'rollback@test.com',
            password: 'hash',
            name: 'Rollback User',
          }),
        );
        await manager.save(
          manager.create(Post, {
            title: 'Will Fail Title',
            content: 'Will fail content',
            imageUrl: 'images/fail.jpg',
            creatorId: user.id,
          }),
        );
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    expect(await users.findOneBy({ email: 'rollback@test.com' })).toBeNull();
  });
});
