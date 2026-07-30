import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'posts' })
@Index('IDX_posts_created_at', ['createdAt'])
@Index('IDX_posts_creator_id', ['creatorId'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  /** Relative path, e.g. `images/<uuid>-.jpg`. */
  @Column({ name: 'image_url', type: 'varchar', length: 512 })
  imageUrl!: string;

  /**
   * Creator FK. ON DELETE RESTRICT so users with posts cannot be removed
   * until the application deletes (and cleans up images for) those posts.
   */
  @ManyToOne(() => User, (user) => user.posts, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creator_id' })
  creator!: User;

  @Column({ name: 'creator_id', type: 'uuid' })
  creatorId!: string;

  /** Optional legacy id (nullable, unique when set). */
  @Index('UQ_posts_legacy_mongo_id', { unique: true })
  @Column({
    name: 'legacy_mongo_id',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  legacyMongoId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
