import { Logger } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { MutationResult } from '../../site-api/inventory-items/graphql/mutation-result.type';
import { Uom } from './graphql/uom.type';
import { UomDimension } from './graphql/uom-dimension.type';
import { CreateUomDimensionInput, UpdateUomDimensionInput } from './graphql/uom-dimension-mutation.input';
import { UomConnection } from './graphql/uom-feed.type';
import { CreateUomInput, UpdateUomInput } from './graphql/uom-mutation.input';
import { UomGatewayService } from './services/uom-gateway.service';

// UOM GraphQL for the mobile UOM screens: the keyset units feed + by-id read + CRUD. Thin forwards to the
// gateway service (which NATS-forwards to commerce-service). Select-options (`uomOptions`) now live in the
// shared SelectApiModule. buId flows via NATS context from @RequireSession.
@Resolver()
export class UomResolver {
  private readonly logger = new Logger(UomResolver.name);

  constructor(private readonly uomGatewayService: UomGatewayService) {}

  // Keyset/cursor Relay connection of a dimension's units (base + derived) for the mobile infinite feed.
  // Relay args (first/after) map to limit/cursor; the client merges pages via relayStylePagination. The
  // fixed sort (base units first, then name) is applied server-side.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => UomConnection, { name: 'uomsFeed' })
  async uomsFeed(
    @Args('dimensionId', { type: () => ID }) dimensionId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<UomConnection> {
    this.logger.log('QUERY uomsFeed');
    return this.uomGatewayService.findForFeed({
      dimensionId,
      limit: first ?? undefined,
      cursor: after ?? undefined,
    });
  }

  // Single unit by id — post-update re-fetch + a by-id read source.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => Uom, { name: 'uom' })
  async uom(@Args('id', { type: () => ID }) id: string): Promise<Uom> {
    this.logger.log('QUERY uom');
    return this.uomGatewayService.findById(id);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => Uom, { name: 'createUom' })
  async createUom(@Args('input') input: CreateUomInput): Promise<Uom> {
    this.logger.log('MUTATION createUom');
    const result = await this.uomGatewayService.create(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => Uom, { name: 'updateUom' })
  async updateUom(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateUomInput): Promise<Uom> {
    this.logger.log('MUTATION updateUom');
    await this.uomGatewayService.update(id, input);
    return this.uomGatewayService.findById(id);
  }

  // Deletes a unit; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteUom' })
  async deleteUom(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteUom');
    return this.uomGatewayService.delete(id);
  }

  // Bounded list of dimensions (small enough to skip Relay pagination).
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => [UomDimension], { name: 'uomDimensions' })
  async uomDimensions(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<UomDimension[]> {
    this.logger.log('QUERY uomDimensions');
    return this.uomGatewayService.listDimensions(search);
  }

  // Single dimension by id — the by-id read redirect + the (later) detail screen read from here.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => UomDimension, { name: 'uomDimension' })
  async uomDimension(@Args('id', { type: () => ID }) id: string): Promise<UomDimension> {
    this.logger.log('QUERY uomDimension');
    return this.uomGatewayService.findDimensionById(id);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => UomDimension, { name: 'createUomDimension' })
  async createUomDimension(@Args('input') input: CreateUomDimensionInput): Promise<UomDimension> {
    this.logger.log('MUTATION createUomDimension');
    const result = await this.uomGatewayService.createDimension(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => UomDimension, { name: 'updateUomDimension' })
  async updateUomDimension(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUomDimensionInput,
  ): Promise<UomDimension> {
    this.logger.log('MUTATION updateUomDimension');
    await this.uomGatewayService.updateDimension(id, input);
    return this.uomGatewayService.findDimensionById(id);
  }

  // Deletes a dimension; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteUomDimension' })
  async deleteUomDimension(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteUomDimension');
    return this.uomGatewayService.deleteDimension(id);
  }
}
