/**
 * MongoDB → PostgreSQL data migration (Phase 6).
 *
 * Usage:
 *   npm run migrate:mongo -- --dry-run
 *   npm run migrate:mongo -- --execute
 *   npm run migrate:mongo -- --execute --copy-images
 *
 * Env:
 *   MONGODB_URI          Source Mongo connection string (required)
 *   DB_*                 Target Postgres (same as Nest app)
 *   MIGRATE_IMAGES_SRC   Optional; default ../archive/social-network-app-backend-express/images
 *   MIGRATE_IMAGES_DEST  Optional; default ./images (UPLOAD_PATH)
 *
 * Flags:
 *   --dry-run                 Plan only (default if --execute omitted)
 *   --execute                 Write users/posts (idempotent via legacy_mongo_id)
 *   --copy-images             Copy present image files source → dest
 *   --write-report            Write JSON under docs/revamp/
 *   --batch-size=N            Mongo cursor batch size (default 200)
 *   --allow-nonstandard-hashes  Allow bcrypt cost ≠ 12
 *   --images-source=PATH
 *   --images-dest=PATH
 */

import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import defaultDataSource from '../src/database/data-source';
import { migrateMongoToPostgres } from '../src/migration/mongo-to-pg';

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function readArg(name: string): string | undefined {
  const prefix = `${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function main(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  const mode = hasFlag('--execute') ? 'execute' : 'dry-run';
  const packageRoot = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(packageRoot, '..');

  const imagesSourceDir =
    readArg('--images-source') ??
    process.env.MIGRATE_IMAGES_SRC ??
    path.join(repoRoot, 'archive', 'social-network-app-backend-express', 'images');

  const imagesDestDir =
    readArg('--images-dest') ??
    process.env.MIGRATE_IMAGES_DEST ??
    path.resolve(packageRoot, process.env.UPLOAD_PATH ?? 'images');

  const batchSize = parseInt(readArg('--batch-size') ?? '200', 10);

  await defaultDataSource.initialize();

  try {
    const report = await migrateMongoToPostgres(defaultDataSource, {
      mode,
      mongodbUri,
      imagesSourceDir,
      imagesDestDir,
      copyImages: hasFlag('--copy-images'),
      batchSize: Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 200,
      allowNonstandardHashes: hasFlag('--allow-nonstandard-hashes'),
    });

    const json = JSON.stringify(report, null, 2);
    console.log(json);

    if (hasFlag('--write-report')) {
      const outDir = path.join(repoRoot, 'docs', 'revamp');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'phase-6-migration-report.json');
      fs.writeFileSync(outPath, `${json}\n`, 'utf8');
      console.error(`Wrote ${outPath}`);
    }

    process.exit(report.exitCode);
  } finally {
    if (defaultDataSource.isInitialized) {
      await defaultDataSource.destroy();
    }
  }
}

main().catch(async (err) => {
  console.error(err);
  if (defaultDataSource.isInitialized) {
    await defaultDataSource.destroy();
  }
  process.exit(1);
});
