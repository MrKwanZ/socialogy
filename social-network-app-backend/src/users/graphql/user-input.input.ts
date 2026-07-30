import { Field, InputType } from '@nestjs/graphql';

@InputType('UserInputData')
export class UserInputData {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  password!: string;
}
