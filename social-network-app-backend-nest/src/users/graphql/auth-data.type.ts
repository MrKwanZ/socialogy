import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AuthData')
export class AuthDataType {
  @Field()
  token!: string;

  @Field()
  userId!: string;
}
