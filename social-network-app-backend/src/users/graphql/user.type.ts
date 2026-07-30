import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PostType } from '../../posts/graphql/post.type';

@ObjectType('User')
export class UserType {
  @Field(() => ID, { name: '_id' })
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  /** Optional in the GraphQL schema; returned for compatibility with the client contract. */
  @Field({ nullable: true })
  password?: string;

  @Field()
  status!: string;

  @Field(() => [PostType])
  posts!: PostType[];
}
