/**
 * MongoDB integrity baseline for Phase 0 / Phase 6 migration rehearsals.
 *
 * Usage:
 *   cd social-network-app-backend
 *   npm run integrity-check
 *
 * Requires MONGODB_URI in the environment or .env.
 * Writes a JSON report to stdout and optionally to
 * docs/revamp/phase-0-integrity-report.json when --write is passed.
 */

import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import User from '../models/user';
import Post from '../models/post';
import { getRootDir } from '../util/paths';

interface IntegrityReport {
  generatedAt: string;
  mongodbUriHost: string;
  users: {
    total: number;
    duplicateEmails: Array<{ email: string; count: number }>;
    missingRequiredFields: number;
    passwordHashCost12: number;
    passwordHashOther: number;
    emptyPostsArray: number;
  };
  posts: {
    total: number;
    orphanedCreator: number;
    missingRequiredFields: number;
    danglingUserPostRefs: number;
    missingImageFiles: number;
    presentImageFiles: number;
  };
  samples: {
    userIds: string[];
    postIds: string[];
    orphanedPostIds: string[];
    missingImagePaths: string[];
  };
  exitCode: number;
}

function redactUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return '(unparseable MONGODB_URI)';
  }
}

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  const writeReport = process.argv.includes('--write');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  const rootDir = getRootDir();
  const users = await User.find().lean();
  const posts = await Post.find().lean();

  const emailCounts = new Map<string, number>();
  for (const user of users) {
    const key = String(user.email ?? '').toLowerCase();
    emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1);
  }

  const duplicateEmails = [...emailCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([email, count]) => ({ email, count }));

  let passwordHashCost12 = 0;
  let passwordHashOther = 0;
  let missingUserRequired = 0;
  let emptyPostsArray = 0;

  for (const user of users) {
    if (!user.email || !user.password || !user.name) {
      missingUserRequired += 1;
    }
    if (/^\$2[aby]\$12\$/.test(String(user.password ?? ''))) {
      passwordHashCost12 += 1;
    } else if (user.password) {
      passwordHashOther += 1;
    }
    if (!Array.isArray(user.posts) || user.posts.length === 0) {
      emptyPostsArray += 1;
    }
  }

  const userIdSet = new Set(users.map((u) => String(u._id)));
  const postIdSet = new Set(posts.map((p) => String(p._id)));

  let orphanedCreator = 0;
  let missingPostRequired = 0;
  let missingImageFiles = 0;
  let presentImageFiles = 0;
  const orphanedPostIds: string[] = [];
  const missingImagePaths: string[] = [];

  for (const post of posts) {
    if (!post.title || !post.content || !post.imageUrl || !post.creator) {
      missingPostRequired += 1;
    }

    const creatorId = String(post.creator);
    if (!userIdSet.has(creatorId)) {
      orphanedCreator += 1;
      orphanedPostIds.push(String(post._id));
    }

    if (post.imageUrl) {
      const absolute = path.join(rootDir, String(post.imageUrl));
      if (fs.existsSync(absolute)) {
        presentImageFiles += 1;
      } else {
        missingImageFiles += 1;
        missingImagePaths.push(String(post.imageUrl));
      }
    }
  }

  let danglingUserPostRefs = 0;
  for (const user of users) {
    for (const ref of user.posts ?? []) {
      const id =
        ref instanceof Types.ObjectId ? ref.toString() : String(ref);
      if (!postIdSet.has(id)) {
        danglingUserPostRefs += 1;
      }
    }
  }

  const hasBlockingIssues =
    duplicateEmails.length > 0 ||
    orphanedCreator > 0 ||
    missingUserRequired > 0 ||
    missingPostRequired > 0 ||
    passwordHashOther > 0;

  const report: IntegrityReport = {
    generatedAt: new Date().toISOString(),
    mongodbUriHost: redactUri(uri),
    users: {
      total: users.length,
      duplicateEmails,
      missingRequiredFields: missingUserRequired,
      passwordHashCost12,
      passwordHashOther,
      emptyPostsArray
    },
    posts: {
      total: posts.length,
      orphanedCreator,
      missingRequiredFields: missingPostRequired,
      danglingUserPostRefs,
      missingImageFiles,
      presentImageFiles
    },
    samples: {
      userIds: users.slice(0, 5).map((u) => String(u._id)),
      postIds: posts.slice(0, 5).map((p) => String(p._id)),
      orphanedPostIds: orphanedPostIds.slice(0, 20),
      missingImagePaths: missingImagePaths.slice(0, 20)
    },
    exitCode: hasBlockingIssues ? 2 : 0
  };

  const json = JSON.stringify(report, null, 2);
  console.log(json);

  if (writeReport) {
    const outDir = path.resolve(rootDir, '..', 'docs', 'revamp');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'phase-0-integrity-report.json');
    fs.writeFileSync(outPath, `${json}\n`, 'utf8');
    console.error(`Wrote ${outPath}`);
  }

  await mongoose.disconnect();
  process.exit(report.exitCode);
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
