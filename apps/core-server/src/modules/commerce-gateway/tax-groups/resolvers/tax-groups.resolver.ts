import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { MutationResult } from '../../inventory-items/graphql/mutation-result.type';
import { TaxGroup } from '../graphql/tax-group.type';
import { CreateTaxGroupInput, UpdateTaxGroupInput } from '../graphql/tax-group-mutation.input';
import { TaxGroupsGatewayService } from '../services/tax-groups-gateway.service';

// Tax groups for the mobile Tax Groups screen: plain list + CRUD. Thin forwards to the gateway service.
// Select-options (`taxGroupsOptions`) now live in the shared SelectApiModule. buId flows via NATS context.
@Resolver()
export class TaxGroupsResolver {
  private readonly logger = new Logger(TaxGroupsResolver.name);

  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  // All tax groups (with rates + canDelete) — the mobile Tax Groups list. Small/bounded, so a plain array.
  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => [TaxGroup], { name: 'taxGroups' })
  async taxGroups(@Args('search', { type: () => String, nullable: true }) search?: string): Promise<TaxGroup[]> {
    this.logger.log('QUERY taxGroups');
    return this.taxGroupsGatewayService.list(search);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => TaxGroup, { name: 'createTaxGroup' })
  async createTaxGroup(@Args('input') input: CreateTaxGroupInput): Promise<TaxGroup> {
    this.logger.log('MUTATION createTaxGroup');
    const result = await this.taxGroupsGatewayService.create(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => TaxGroup, { name: 'updateTaxGroup' })
  async updateTaxGroup(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTaxGroupInput,
  ): Promise<TaxGroup> {
    this.logger.log('MUTATION updateTaxGroup');
    await this.taxGroupsGatewayService.update(id, input);
    return this.taxGroupsGatewayService.findById(id);
  }

  // Deletes a tax group; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteTaxGroup' })
  async deleteTaxGroup(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteTaxGroup');
    return this.taxGroupsGatewayService.delete(id);
  }
}
