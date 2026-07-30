import { Query, Resolver } from '@nestjs/graphql';

/**
 * Phase 1 placeholder so Apollo can boot with a non-empty schema.
 * Domain operations are added in Phases 3–4.
 */
@Resolver()
export class HealthResolver {
  @Query(() => String, {
    name: 'health',
    description: 'Lightweight GraphQL liveness probe for Phase 1 foundation',
  })
  health(): string {
    return 'ok';
  }
}
