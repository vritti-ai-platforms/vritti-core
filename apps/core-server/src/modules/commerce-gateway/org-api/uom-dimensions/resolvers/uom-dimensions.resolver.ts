import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { MutationResult } from '../../../site-api/inventory-items/graphql/mutation-result.type';
import { UomDimension } from '../graphql/uom-dimension.type';
import { CreateUomDimensionInput, UpdateUomDimensionInput } from '../graphql/uom-dimension-mutation.input';
import { UomDimensionsGatewayService } from '../services/uom-dimensions-gateway.service';

// UOM dimensions for the mobile UOM screen. Thin GraphQL forwards to the existing gateway service (which
// proxies the commerce-service NATS handlers). The list is small/bounded, so it's a plain array (no Relay
// connection). buId flows via NATS context from @RequireSession.
@Resolver()
export class UomDimensionsResolver {
  private readonly logger = new Logger(UomDimensionsResolver.name);

  constructor(private readonly uomDimensionsGatewayService: UomDimensionsGatewayService) {}

  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => [UomDimension], { name: 'uomDimensions' })
  async uomDimensions(
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<UomDimension[]> {
    this.logger.log('QUERY uomDimensions');
    return this.uomDimensionsGatewayService.list(search);
  }

  // Single dimension by id — the by-id read redirect + the (later) detail screen read from here.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => UomDimension, { name: 'uomDimension' })
  async uomDimension(@Args('id', { type: () => ID }) id: string): Promise<UomDimension> {
    this.logger.log('QUERY uomDimension');
    return this.uomDimensionsGatewayService.findById(id);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => UomDimension, { name: 'createUomDimension' })
  async createUomDimension(@Args('input') input: CreateUomDimensionInput): Promise<UomDimension> {
    this.logger.log('MUTATION createUomDimension');
    const result = await this.uomDimensionsGatewayService.create(input);
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
    await this.uomDimensionsGatewayService.update(id, input);
    return this.uomDimensionsGatewayService.findById(id);
  }

  // Deletes a dimension; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteUomDimension' })
  async deleteUomDimension(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteUomDimension');
    return this.uomDimensionsGatewayService.delete(id);
  }
}
