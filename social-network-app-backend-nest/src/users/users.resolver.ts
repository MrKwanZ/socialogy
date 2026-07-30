import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserType } from './graphql/user.type';
import { AuthDataType } from './graphql/auth-data.type';
import { UserInputData } from './graphql/user-input.input';
import { CurrentGqlContext } from '../auth/current-gql-context.decorator';
import type { GqlContext } from '../auth/auth.types';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly authService: AuthService) {}

  /** Frozen SDL: login is a Query, not a Mutation. */
  @Query(() => AuthDataType, { name: 'login' })
  login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthDataType> {
    return this.authService.login(email, password);
  }

  @Query(() => UserType, { name: 'user' })
  user(@CurrentGqlContext() ctx: GqlContext): Promise<UserType> {
    return this.authService.currentUser(ctx);
  }

  @Mutation(() => UserType, { name: 'createUser' })
  createUser(
    @Args('userInput', { type: () => UserInputData }) userInput: UserInputData,
  ): Promise<UserType> {
    return this.authService.createUser(userInput);
  }

  @Mutation(() => UserType, { name: 'updateStatus' })
  updateStatus(
    @Args('status') status: string,
    @CurrentGqlContext() ctx: GqlContext,
  ): Promise<UserType> {
    return this.authService.updateStatus(status, ctx);
  }
}
