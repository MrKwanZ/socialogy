import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserType } from '../../users/graphql/user.type';

@ObjectType('Post')
export class PostType {
  @Field(() => ID, { name: '_id' })
  id!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field()
  imageUrl!: string;

  @Field(() => UserType)
  creator!: UserType;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}
