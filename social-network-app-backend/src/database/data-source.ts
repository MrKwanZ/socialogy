import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { InitialSchema1753792800000 } from '../migrations/1753792800000-InitialSchema';

config();

/**
 * TypeORM CLI DataSource. Always synchronize: false — schema changes go through migrations.
 */
const defaultDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: [User, Post],
  migrations: [InitialSchema1753792800000],
});

export default defaultDataSource;
