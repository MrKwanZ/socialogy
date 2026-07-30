import validator from 'validator';
import { DEFAULT_USER_STATUS } from '../../users/user.entity';
import type {
  MongoPostDoc,
  MongoUserDoc,
  PlannedPost,
  PlannedUser,
  SourceIssues,
} from './types';

const BCRYPT_COST_12 = /^\$2[aby]\$12\$/;

export function redactMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return '(unparseable MONGODB_URI)';
  }
}

export function analyzeSource(
  users: MongoUserDoc[],
  posts: MongoPostDoc[],
): SourceIssues {
  const emailCounts = new Map<string, number>();
  const missingUserRequiredFields: string[] = [];
  const nonCost12PasswordUserIds: string[] = [];
  const invalidEmailUserIds: string[] = [];

  for (const user of users) {
    const mongoId = String(user._id);
    const email = String(user.email ?? '')
      .trim()
      .toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);

    if (!user.email || !user.password || !user.name) {
      missingUserRequiredFields.push(mongoId);
    } else if (!validator.isEmail(email)) {
      invalidEmailUserIds.push(mongoId);
    }

    if (user.password && !BCRYPT_COST_12.test(String(user.password))) {
      nonCost12PasswordUserIds.push(mongoId);
    }
  }

  const duplicateEmails = [...emailCounts.entries()]
    .filter(([email, count]) => email.length > 0 && count > 1)
    .map(([email, count]) => ({ email, count }));

  const userIdSet = new Set(users.map((u) => String(u._id)));
  const missingPostRequiredFields: string[] = [];
  const orphanedCreatorPostIds: string[] = [];

  for (const post of posts) {
    const mongoId = String(post._id);
    if (!post.title || !post.content || !post.imageUrl || !post.creator) {
      missingPostRequiredFields.push(mongoId);
    }
    if (post.creator && !userIdSet.has(String(post.creator))) {
      orphanedCreatorPostIds.push(mongoId);
    }
  }

  return {
    duplicateEmails,
    missingUserRequiredFields,
    missingPostRequiredFields,
    orphanedCreatorPostIds,
    nonCost12PasswordUserIds,
    invalidEmailUserIds,
  };
}

export function countBlockingIssues(
  issues: SourceIssues,
  allowNonstandardHashes: boolean,
): number {
  return (
    issues.duplicateEmails.length +
    issues.missingUserRequiredFields.length +
    issues.missingPostRequiredFields.length +
    issues.orphanedCreatorPostIds.length +
    issues.invalidEmailUserIds.length +
    (allowNonstandardHashes ? 0 : issues.nonCost12PasswordUserIds.length)
  );
}

export function planUsers(users: MongoUserDoc[]): PlannedUser[] {
  const now = new Date();
  return users.map((user) => {
    const createdAt = user.createdAt ? new Date(user.createdAt) : now;
    const updatedAt = user.updatedAt ? new Date(user.updatedAt) : createdAt;
    return {
      mongoId: String(user._id),
      email: String(user.email).trim().toLowerCase(),
      password: String(user.password),
      name: String(user.name),
      status: String(user.status ?? DEFAULT_USER_STATUS),
      createdAt,
      updatedAt,
    };
  });
}

export function planPosts(posts: MongoPostDoc[]): PlannedPost[] {
  const now = new Date();
  return posts.map((post) => {
    const createdAt = post.createdAt ? new Date(post.createdAt) : now;
    const updatedAt = post.updatedAt ? new Date(post.updatedAt) : createdAt;
    return {
      mongoId: String(post._id),
      title: String(post.title),
      content: String(post.content),
      imageUrl: String(post.imageUrl),
      creatorMongoId: String(post.creator),
      createdAt,
      updatedAt,
    };
  });
}
