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

  /** Optional in SDL; Express currently returns the hash via formatUser. */
  @Field({ nullable: true })
  password?: string;

  @Field()
  status!: string;

  @Field(() => [PostType])
  posts!: PostType[];
}
