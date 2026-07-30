import { DataSource } from 'typeorm';
import { User } from '../../src/users/user.entity';
import { Post } from '../../src/posts/post.entity';
import { InitialSchema1753792800000 } from '../../src/migrations/1753792800000-InitialSchema';

export function createTestDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'socialogy',
    synchronize: false,
    entities: [User, Post],
    migrations: [InitialSchema1753792800000],
  });
}

export async function resetSchema(dataSource: DataSource): Promise<void> {
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
}

export async function clearTables(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE "posts", "users" RESTART IDENTITY CASCADE',
  );
}
