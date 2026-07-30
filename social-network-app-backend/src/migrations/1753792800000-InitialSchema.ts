import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1753792800000 implements MigrationInterface {
  name = 'InitialSchema1753792800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "status" character varying(255) NOT NULL DEFAULT 'I am new!',
        "legacy_mongo_id" character varying(24),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_legacy_mongo_id" ON "users" ("legacy_mongo_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "image_url" character varying(512) NOT NULL,
        "creator_id" uuid NOT NULL,
        "legacy_mongo_id" character varying(24),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_creator_id" FOREIGN KEY ("creator_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_posts_created_at" ON "posts" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_creator_id" ON "posts" ("creator_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_posts_legacy_mongo_id" ON "posts" ("legacy_mongo_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_posts_legacy_mongo_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_creator_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_legacy_mongo_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
