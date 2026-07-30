import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from './auth.types';

export const CurrentGqlContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GqlContext => {
    const gqlCtx = GqlExecutionContext.create(context);
    return gqlCtx.getContext<GqlContext>();
  },
);
