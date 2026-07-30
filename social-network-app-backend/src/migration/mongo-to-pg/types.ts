export interface MongoUserDoc {
  _id: { toString(): string };
  email?: string;
  password?: string;
  name?: string;
  status?: string;
  posts?: Array<{ toString(): string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MongoPostDoc {
  _id: { toString(): string };
  title?: string;
  content?: string;
  imageUrl?: string;
  creator?: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlannedUser {
  mongoId: string;
  email: string;
  password: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlannedPost {
  mongoId: string;
  title: string;
  content: string;
  imageUrl: string;
  creatorMongoId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceIssues {
  duplicateEmails: Array<{ email: string; count: number }>;
  missingUserRequiredFields: string[];
  missingPostRequiredFields: string[];
  orphanedCreatorPostIds: string[];
  nonCost12PasswordUserIds: string[];
  invalidEmailUserIds: string[];
}

export interface ImageCheckResult {
  present: string[];
  missing: string[];
  copied: string[];
  skippedExisting: string[];
}

export interface MigrationReport {
  generatedAt: string;
  mode: 'dry-run' | 'execute';
  mongodbUriHost: string;
  postgresDatabase: string;
  durationMs: number;
  source: {
    users: number;
    posts: number;
  };
  planned: {
    usersToInsert: number;
    usersAlreadyMigrated: number;
    postsToInsert: number;
    postsAlreadyMigrated: number;
  };
  executed: {
    usersInserted: number;
    postsInserted: number;
  };
  target: {
    users: number;
    posts: number;
    usersWithLegacyId: number;
    postsWithLegacyId: number;
  };
  issues: SourceIssues;
  images: ImageCheckResult;
  samples: {
    userMappings: Array<{ mongoId: string; postgresId: string; email: string }>;
    postMappings: Array<{
      mongoId: string;
      postgresId: string;
      creatorPostgresId: string;
    }>;
  };
  blockingIssueCount: number;
  exitCode: number;
}

export interface MigrateOptions {
  mode: 'dry-run' | 'execute';
  mongodbUri: string;
  /** Absolute path to source images directory (Express uploads). */
  imagesSourceDir?: string;
  /** Absolute path to destination images directory (Nest uploads). */
  imagesDestDir?: string;
  /** When true, copy present image files during execute. */
  copyImages: boolean;
  batchSize: number;
  allowNonstandardHashes: boolean;
}
