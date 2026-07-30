import fs from 'fs';
import os from 'os';
import path from 'path';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';
import {
  migrateMongoToPostgres,
  seedMongoFixture,
} from '../src/migration/mongo-to-pg';
import { User } from '../src/users/user.entity';
import { Post } from '../src/posts/post.entity';
import { createTestDataSource, resetSchema } from './utils/test-data-source';

describe('Mongo → PostgreSQL migration (Phase 6)', () => {
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;
  let dataSource: DataSource;
  let imagesSrc: string;
  let imagesDest: string;
  const password = 'tester';
  let passwordHash: string;
  const userId = new ObjectId();
  const postId = new ObjectId();
  const createdAt = new Date('2024-06-15T12:00:00.000Z');

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 12);
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri('socialogy_migrate');

    imagesSrc = fs.mkdtempSync(path.join(os.tmpdir(), 'soc-img-src-'));
    imagesDest = fs.mkdtempSync(path.join(os.tmpdir(), 'soc-img-dest-'));
    fs.writeFileSync(path.join(imagesSrc, 'legacy-.jpg'), 'fake-jpeg');

    dataSource = createTestDataSource();
    await dataSource.initialize();
    await resetSchema(dataSource);
  }, 120000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await mongoServer?.stop();
    fs.rmSync(imagesSrc, { recursive: true, force: true });
    fs.rmSync(imagesDest, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await resetSchema(dataSource);
    await seedMongoFixture(mongoUri, {
      users: [
        {
          _id: userId,
          email: 'Migrate@Example.com',
          password: passwordHash,
          name: 'Migrator',
          status: 'Ready',
          posts: [postId],
        },
      ],
      posts: [
        {
          _id: postId,
          title: 'Migrated Post Title',
          content: 'Migrated post content body',
          imageUrl: 'images/legacy-.jpg',
          creator: userId,
          createdAt,
          updatedAt: createdAt,
        },
      ],
    });
  });

  it('dry-run reports plan without writing rows', async () => {
    const report = await migrateMongoToPostgres(dataSource, {
      mode: 'dry-run',
      mongodbUri: mongoUri,
      imagesSourceDir: imagesSrc,
      imagesDestDir: imagesDest,
      copyImages: true,
      batchSize: 50,
      allowNonstandardHashes: false,
    });

    expect(report.exitCode).toBe(0);
    expect(report.blockingIssueCount).toBe(0);
    expect(report.source).toEqual({ users: 1, posts: 1 });
    expect(report.planned.usersToInsert).toBe(1);
    expect(report.planned.postsToInsert).toBe(1);
    expect(report.executed.usersInserted).toBe(0);
    expect(report.executed.postsInserted).toBe(0);
    expect(await dataSource.getRepository(User).count()).toBe(0);
    expect(report.images.present).toEqual(['images/legacy-.jpg']);
    expect(report.images.copied).toEqual(['images/legacy-.jpg']);
  });

  it('execute migrates rows, preserves hash/timestamps, copies images, and is idempotent', async () => {
    const first = await migrateMongoToPostgres(dataSource, {
      mode: 'execute',
      mongodbUri: mongoUri,
      imagesSourceDir: imagesSrc,
      imagesDestDir: imagesDest,
      copyImages: true,
      batchSize: 50,
      allowNonstandardHashes: false,
    });

    expect(first.exitCode).toBe(0);
    expect(first.executed).toEqual({ usersInserted: 1, postsInserted: 1 });
    expect(first.target.usersWithLegacyId).toBe(1);
    expect(first.target.postsWithLegacyId).toBe(1);
    expect(first.images.copied).toEqual(['images/legacy-.jpg']);
    expect(fs.existsSync(path.join(imagesDest, 'legacy-.jpg'))).toBe(true);

    const user = await dataSource.getRepository(User).findOneByOrFail({
      legacyMongoId: userId.toHexString(),
    });
    expect(user.email).toBe('migrate@example.com');
    expect(user.name).toBe('Migrator');
    expect(user.status).toBe('Ready');
    expect(user.password).toBe(passwordHash);
    expect(await bcrypt.compare(password, user.password)).toBe(true);

    const post = await dataSource.getRepository(Post).findOneByOrFail({
      legacyMongoId: postId.toHexString(),
    });
    expect(post.creatorId).toBe(user.id);
    expect(post.title).toBe('Migrated Post Title');
    expect(post.imageUrl).toBe('images/legacy-.jpg');
    expect(post.createdAt.toISOString()).toBe(createdAt.toISOString());

    const second = await migrateMongoToPostgres(dataSource, {
      mode: 'execute',
      mongodbUri: mongoUri,
      imagesSourceDir: imagesSrc,
      imagesDestDir: imagesDest,
      copyImages: true,
      batchSize: 50,
      allowNonstandardHashes: false,
    });

    expect(second.exitCode).toBe(0);
    expect(second.planned.usersAlreadyMigrated).toBe(1);
    expect(second.planned.postsAlreadyMigrated).toBe(1);
    expect(second.executed).toEqual({ usersInserted: 0, postsInserted: 0 });
    expect(second.images.skippedExisting).toEqual(['images/legacy-.jpg']);
    expect(await dataSource.getRepository(User).count()).toBe(1);
    expect(await dataSource.getRepository(Post).count()).toBe(1);
  });

  it('refuses execute when source has orphaned posts', async () => {
    await seedMongoFixture(mongoUri, {
      users: [
        {
          _id: userId,
          email: 'ok@example.com',
          password: passwordHash,
          name: 'Ok',
        },
      ],
      posts: [
        {
          _id: postId,
          title: 'Orphan Title Here',
          content: 'Orphan content body text',
          imageUrl: 'images/legacy-.jpg',
          creator: new ObjectId(),
          createdAt,
          updatedAt: createdAt,
        },
      ],
    });

    const report = await migrateMongoToPostgres(dataSource, {
      mode: 'execute',
      mongodbUri: mongoUri,
      imagesSourceDir: imagesSrc,
      imagesDestDir: imagesDest,
      copyImages: false,
      batchSize: 50,
      allowNonstandardHashes: false,
    });

    expect(report.exitCode).toBe(2);
    expect(report.blockingIssueCount).toBeGreaterThan(0);
    expect(report.executed.usersInserted).toBe(0);
    expect(await dataSource.getRepository(User).count()).toBe(0);
  });
});
