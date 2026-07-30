import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { PostType } from './graphql/post.type';
import { PostDataType } from './graphql/post-data.type';
import { PostInputData } from './graphql/post-input.input';
import { CurrentGqlContext } from '../auth/current-gql-context.decorator';
import type { GqlContext } from '../auth/auth.types';
import { UserType } from '../users/graphql/user.type';

@Resolver(() => PostType)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PostDataType, { name: 'posts' })
  posts(
    @Args('page', { type: () => Int, nullable: true }) page: number | undefined,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<PostDataType> {
    return this.postsService.listPosts(page, ctx);
  }

  @Query(() => PostType, { name: 'post' })
  post(
    @Args('id', { type: () => ID }) id: string,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<PostType> {
    return this.postsService.getPost(id, ctx);
  }

  @Mutation(() => PostType, { name: 'createPost' })
  createPost(
    @Args('postInput', { type: () => PostInputData }) postInput: PostInputData,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<PostType> {
    return this.postsService.createPost(postInput, ctx);
  }

  @Mutation(() => PostType, { name: 'updatePost' })
  updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('postInput', { type: () => PostInputData }) postInput: PostInputData,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<PostType> {
    return this.postsService.updatePost(id, postInput, ctx);
  }

  @Mutation(() => Boolean, { name: 'deletePost', nullable: true })
  deletePost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<boolean> {
    return this.postsService.deletePost(id, ctx);
  }
}

@Resolver(() => UserType)
export class UserPostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField(() => [PostType])
  posts(@Parent() user: UserType): Promise<PostType[]> {
    return this.postsService.findByCreatorId(user.id);
  }
}
