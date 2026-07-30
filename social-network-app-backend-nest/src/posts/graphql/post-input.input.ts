import { Field, InputType } from '@nestjs/graphql';

@InputType('PostInputData')
export class PostInputData {
  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field()
  imageUrl!: string;
}
