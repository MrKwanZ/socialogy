import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import validator from 'validator';
import { ValidationErrorItem } from '../common/errors/app.error';
import { raiseAppError } from '../common/errors/raise-app-error';
import { isUuid, toPostType } from '../common/mappers/graphql.mappers';
import type { GqlContext } from '../auth/auth.types';
import { AuthService } from '../users/auth.service';
import { UsersService } from '../users/users.service';
import { clearImage } from '../util/file';
import { TypedConfigService } from '../config/typed-config.service';
import { Post } from './post.entity';
import { PostInputData } from './graphql/post-input.input';
import { PostType } from './graphql/post.type';
import { PostDataType } from './graphql/post-data.type';

const PER_PAGE = 2;

@Injectable()
export class PostsService {
  private readonly uploadPath: string;

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    config: TypedConfigService,
  ) {
    this.uploadPath = config.get('app', { infer: true })!.uploadPath;
  }

  async createPost(
    postInput: PostInputData,
    ctx: GqlContext,
  ): Promise<PostType> {
    const userId = this.authService.requireAuth(ctx);
    this.assertPostInput(postInput);

    const user = await this.usersService.findById(userId);
    if (!user) {
      raiseAppError('Invalid user.', 401);
    }

    const post = this.postsRepository.create({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creatorId: user.id,
      creator: user,
    });
    const created = await this.postsRepository.save(post);
    created.creator = user;
    return toPostType(created);
  }

  async listPosts(
    page: number | undefined,
    ctx: GqlContext,
  ): Promise<PostDataType> {
    this.authService.requireAuth(ctx);

    const currentPage = page ?? 1;
    const [posts, totalPosts] = await this.postsRepository.findAndCount({
      relations: { creator: true },
      order: { createdAt: 'DESC' },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    });

    return {
      posts: posts.map((post) => toPostType(post)),
      totalPosts,
    };
  }

  async getPost(id: string, ctx: GqlContext): Promise<PostType> {
    this.authService.requireAuth(ctx);
    const post = await this.findPostOrFail(id);
    return toPostType(post);
  }

  async updatePost(
    id: string,
    postInput: PostInputData,
    ctx: GqlContext,
  ): Promise<PostType> {
    const userId = this.authService.requireAuth(ctx);
    const post = await this.findPostOrFail(id);

    if (post.creatorId !== userId) {
      raiseAppError('Not authorized!', 403);
    }

    this.assertPostInput(postInput);

    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }

    const updated = await this.postsRepository.save(post);
    if (!updated.creator) {
      updated.creator = post.creator;
    }
    return toPostType(updated);
  }

  async deletePost(id: string, ctx: GqlContext): Promise<boolean> {
    const userId = this.authService.requireAuth(ctx);
    const post = await this.findPostOrFail(id, false);

    if (post.creatorId !== userId) {
      raiseAppError('Not authorized!', 403);
    }

    clearImage(post.imageUrl, this.uploadPath);
    await this.postsRepository.delete(post.id);
    return true;
  }

  async findByCreatorId(creatorId: string): Promise<PostType[]> {
    const posts = await this.postsRepository.find({
      where: { creatorId },
      relations: { creator: true },
      order: { createdAt: 'DESC' },
    });
    return posts.map((post) => toPostType(post));
  }

  private assertPostInput(postInput: PostInputData): void {
    const errors: ValidationErrorItem[] = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }

    if (errors.length > 0) {
      raiseAppError('Invalid input.', 422, errors);
    }
  }

  private async findPostOrFail(id: string, withCreator = true): Promise<Post> {
    if (!isUuid(id)) {
      raiseAppError('No post found!', 404);
    }

    const post = await this.postsRepository.findOne({
      where: { id },
      relations: withCreator ? { creator: true } : undefined,
    });

    if (!post) {
      raiseAppError('No post found!', 404);
    }

    return post;
  }
}
