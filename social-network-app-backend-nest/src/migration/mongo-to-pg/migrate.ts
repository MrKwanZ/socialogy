import { randomUUID } from 'crypto';
import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
import { DataSource, EntityManager } from 'typeorm';
import { Post } from '../../posts/post.entity';
import { User } from '../../users/user.entity';
import { checkImages, copyImages, resolveImagePath } from './images';
import {
  analyzeSource,
  countBlockingIssues,
  planPosts,
  planUsers,
  redactMongoUri,
} from './transform';
import type {
  MigrateOptions,
  MigrationReport,
  MongoPostDoc,
  MongoUserDoc,
  PlannedPost,
  PlannedUser,
} from './types';

async function loadMongoDocuments(
  uri: string,
  batchSize: number,
): Promise<{ users: MongoUserDoc[]; posts: MongoPostDoc[] }> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  try {
    const db = client.db();
    const users: MongoUserDoc[] = [];
    const posts: MongoPostDoc[] = [];

    const userCursor = db.collection('users').find({}).batchSize(batchSize);
    for await (const doc of userCursor) {
      users.push(doc);
    }

    const postCursor = db.collection('posts').find({}).batchSize(batchSize);
    for await (const doc of postCursor) {
      posts.push(doc);
    }

    return { users, posts };
  } finally {
    await client.close();
  }
}

async function loadExistingLegacyMaps(dataSource: DataSource): Promise<{
  userByMongoId: Map<string, string>;
  postByMongoId: Map<string, string>;
}> {
  const users = await dataSource.getRepository(User).find({
    select: ['id', 'legacyMongoId'],
  });
  const posts = await dataSource.getRepository(Post).find({
    select: ['id', 'legacyMongoId'],
  });

  const userByMongoId = new Map<string, string>();
  for (const user of users) {
    if (user.legacyMongoId) {
      userByMongoId.set(user.legacyMongoId, user.id);
    }
  }

  const postByMongoId = new Map<string, string>();
  for (const post of posts) {
    if (post.legacyMongoId) {
      postByMongoId.set(post.legacyMongoId, post.id);
    }
  }

  return { userByMongoId, postByMongoId };
}

async function insertUsersWithManager(
  manager: EntityManager,
  toInsert: PlannedUser[],
  userByMongoId: Map<string, string>,
): Promise<number> {
  if (toInsert.length === 0) {
    return 0;
  }

  const rows = toInsert.map((user) => {
    const id = randomUUID();
    userByMongoId.set(user.mongoId, id);
    return {
      id,
      email: user.email,
      password: user.password,
      name: user.name,
      status: user.status,
      legacyMongoId: user.mongoId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  await manager.createQueryBuilder().insert().into(User).values(rows).execute();
  return rows.length;
}

async function insertPostsWithManager(
  manager: EntityManager,
  toInsert: PlannedPost[],
  userByMongoId: Map<string, string>,
  postByMongoId: Map<string, string>,
): Promise<number> {
  if (toInsert.length === 0) {
    return 0;
  }

  const rows = toInsert.map((post) => {
    const creatorId = userByMongoId.get(post.creatorMongoId);
    if (!creatorId) {
      throw new Error(
        `Missing mapped creator for post ${post.mongoId} (creator ${post.creatorMongoId})`,
      );
    }
    const id = randomUUID();
    postByMongoId.set(post.mongoId, id);
    return {
      id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      creatorId,
      legacyMongoId: post.mongoId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  });

  await manager.createQueryBuilder().insert().into(Post).values(rows).execute();
  return rows.length;
}

function planImageCopy(
  presentUrls: string[],
  imagesDestDir: string | undefined,
  mode: 'dry-run' | 'execute',
  imagesSourceDir: string | undefined,
  shouldCopy: boolean,
): { copied: string[]; skippedExisting: string[] } {
  if (!shouldCopy || !imagesSourceDir || !imagesDestDir) {
    return { copied: [], skippedExisting: [] };
  }

  if (mode === 'dry-run') {
    const copied: string[] = [];
    const skippedExisting: string[] = [];
    for (const imageUrl of presentUrls) {
      const dest = resolveImagePath(imagesDestDir, imageUrl);
      if (fs.existsSync(dest)) {
        skippedExisting.push(imageUrl);
      } else {
        copied.push(imageUrl);
      }
    }
    return { copied, skippedExisting };
  }

  return copyImages(presentUrls, imagesSourceDir, imagesDestDir);
}

export async function migrateMongoToPostgres(
  dataSource: DataSource,
  options: MigrateOptions,
): Promise<MigrationReport> {
  const started = Date.now();
  const { users, posts } = await loadMongoDocuments(
    options.mongodbUri,
    options.batchSize,
  );

  const issues = analyzeSource(users, posts);
  const blockingIssueCount = countBlockingIssues(
    issues,
    options.allowNonstandardHashes,
  );

  const plannedUsers = planUsers(users);
  const plannedPosts = planPosts(posts);

  const { userByMongoId, postByMongoId } =
    await loadExistingLegacyMaps(dataSource);

  const usersToInsert = plannedUsers.filter(
    (u) => !userByMongoId.has(u.mongoId),
  );
  const usersAlreadyMigrated = plannedUsers.length - usersToInsert.length;
  const postsToInsert = plannedPosts.filter(
    (p) => !postByMongoId.has(p.mongoId),
  );
  const postsAlreadyMigrated = plannedPosts.length - postsToInsert.length;

  const imageCheck = checkImages(plannedPosts, options.imagesSourceDir);

  let usersInserted = 0;
  let postsInserted = 0;
  let copied: string[] = [];
  let skippedExisting: string[] = [];

  if (options.mode === 'execute' && blockingIssueCount === 0) {
    await dataSource.transaction(async (manager) => {
      usersInserted = await insertUsersWithManager(
        manager,
        usersToInsert,
        userByMongoId,
      );
      postsInserted = await insertPostsWithManager(
        manager,
        postsToInsert,
        userByMongoId,
        postByMongoId,
      );
    });

    const imageResult = planImageCopy(
      imageCheck.present,
      options.imagesDestDir,
      'execute',
      options.imagesSourceDir,
      options.copyImages,
    );
    copied = imageResult.copied;
    skippedExisting = imageResult.skippedExisting;
  } else {
    const imageResult = planImageCopy(
      imageCheck.present,
      options.imagesDestDir,
      'dry-run',
      options.imagesSourceDir,
      options.copyImages,
    );
    copied = imageResult.copied;
    skippedExisting = imageResult.skippedExisting;
  }

  const targetUsers = await dataSource.getRepository(User).count();
  const targetPosts = await dataSource.getRepository(Post).count();
  const usersWithLegacyId = await dataSource
    .getRepository(User)
    .createQueryBuilder('u')
    .where('u.legacyMongoId IS NOT NULL')
    .getCount();
  const postsWithLegacyId = await dataSource
    .getRepository(Post)
    .createQueryBuilder('p')
    .where('p.legacyMongoId IS NOT NULL')
    .getCount();

  const reconciledUsers =
    options.mode === 'execute'
      ? usersInserted + usersAlreadyMigrated === plannedUsers.length
      : true;
  const reconciledPosts =
    options.mode === 'execute'
      ? postsInserted + postsAlreadyMigrated === plannedPosts.length
      : true;

  let exitCode = 0;
  if (blockingIssueCount > 0) {
    exitCode = 2;
  } else if (
    options.mode === 'execute' &&
    (!reconciledUsers || !reconciledPosts)
  ) {
    exitCode = 3;
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    mongodbUriHost: redactMongoUri(options.mongodbUri),
    postgresDatabase: dataSource.options.database
      ? String(dataSource.options.database)
      : '(unknown)',
    durationMs: Date.now() - started,
    source: {
      users: users.length,
      posts: posts.length,
    },
    planned: {
      usersToInsert: usersToInsert.length,
      usersAlreadyMigrated,
      postsToInsert: postsToInsert.length,
      postsAlreadyMigrated,
    },
    executed: {
      usersInserted,
      postsInserted,
    },
    target: {
      users: targetUsers,
      posts: targetPosts,
      usersWithLegacyId,
      postsWithLegacyId,
    },
    issues,
    images: {
      present: imageCheck.present,
      missing: imageCheck.missing,
      copied,
      skippedExisting,
    },
    samples: {
      userMappings: plannedUsers.slice(0, 5).map((u) => ({
        mongoId: u.mongoId,
        postgresId: userByMongoId.get(u.mongoId) ?? '(pending)',
        email: u.email,
      })),
      postMappings: plannedPosts.slice(0, 5).map((p) => ({
        mongoId: p.mongoId,
        postgresId: postByMongoId.get(p.mongoId) ?? '(pending)',
        creatorPostgresId: userByMongoId.get(p.creatorMongoId) ?? '(pending)',
      })),
    },
    blockingIssueCount,
    exitCode,
  };
}

/** Seed helper for tests: write Express-shaped docs into Mongo. */
export async function seedMongoFixture(
  uri: string,
  fixture: {
    users: Array<{
      _id?: ObjectId;
      email: string;
      password: string;
      name: string;
      status?: string;
      posts?: ObjectId[];
    }>;
    posts: Array<{
      _id?: ObjectId;
      title: string;
      content: string;
      imageUrl: string;
      creator: ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    }>;
  },
): Promise<void> {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db();
    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});
    if (fixture.users.length > 0) {
      await db.collection('users').insertMany(fixture.users);
    }
    if (fixture.posts.length > 0) {
      await db.collection('posts').insertMany(fixture.posts);
    }
  } finally {
    await client.close();
  }
}
