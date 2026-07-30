import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

export const DEFAULT_USER_STATUS = 'I am new!';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Normalized (lowercase) email; unique across users. */
  @Index('UQ_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  /** bcryptjs hash (cost 12 in production auth). */
  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, default: DEFAULT_USER_STATUS })
  status!: string;

  /** Original MongoDB ObjectId string for Phase 6 migration traceability. */
  @Index('UQ_users_legacy_mongo_id', { unique: true })
  @Column({
    name: 'legacy_mongo_id',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  legacyMongoId!: string | null;

  @OneToMany(() => Post, (post) => post.creator)
  posts!: Post[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }
}
