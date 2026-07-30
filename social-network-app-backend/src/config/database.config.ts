import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { InitialSchema1753792800000 } from '../migrations/1753792800000-InitialSchema';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // Migrations own the schema. Never enable sync outside disposable local experiments.
    synchronize: false,
    autoLoadEntities: true,
    entities: [User, Post],
    migrations: [InitialSchema1753792800000],
  }),
);
