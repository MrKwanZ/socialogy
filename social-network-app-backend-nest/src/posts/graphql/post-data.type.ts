import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PostType } from './post.type';

@ObjectType('PostData')
export class PostDataType {
  @Field(() => [PostType])
  posts!: PostType[];

  @Field(() => Int)
  totalPosts!: number;
}
