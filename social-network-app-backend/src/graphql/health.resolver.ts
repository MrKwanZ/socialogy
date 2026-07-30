import { Query, Resolver } from '@nestjs/graphql';

/**
 * Minimal GraphQL query so Apollo can boot with a non-empty schema.
 */
@Resolver()
export class HealthResolver {
  @Query(() => String, {
    name: 'health',
    description: 'Lightweight GraphQL liveness probe',
  })
  health(): string {
    return 'ok';
  }
}
