import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AppConfigModule } from './config/config.module';
import { TypedConfigService } from './config/typed-config.service';
import { DatabaseModule } from './database/database.module';
import { GraphqlFoundationModule } from './graphql/graphql-foundation.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { UploadsModule } from './uploads/uploads.module';
import { formatGraphqlError } from './common/errors/format-graphql-error';
import { createGqlContext } from './auth/create-gql-context';
import { OptionalJwtMiddleware } from './auth/optional-jwt.middleware';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    PostsModule,
    UploadsModule,
    HealthModule,
    GraphqlFoundationModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AppConfigModule, UsersModule],
      inject: [TypedConfigService, JwtService],
      useFactory: (config: TypedConfigService, jwtService: JwtService) => {
        const auth = config.get('auth', { infer: true })!;
        return {
          path: '/graphql',
          autoSchemaFile: true,
          sortSchema: true,
          playground: true,
          csrfPrevention: false,
          context: ({ req }: { req: Request }) =>
            createGqlContext(req, jwtService, auth.jwt.secret),
          formatError: formatGraphqlError,
        };
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OptionalJwtMiddleware).forRoutes('*');
  }
}
