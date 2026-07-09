import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { MutationResult } from '../../inventory-items/graphql/mutation-result.type';
import { TaxGroup } from '../graphql/tax-group.type';
import { CreateTaxGroupInput, UpdateTaxGroupInput } from '../graphql/tax-group-mutation.input';
import { TaxGroupsGatewayService } from '../services/tax-groups-gateway.service';

// Tax groups for the mobile Tax Groups screen. Thin GraphQL forwards to the existing gateway service (which
// NATS-forwards to commerce-service). The list is small/bounded, so it's a plain array (no Relay connection).
// buId flows via NATS context from @RequireSession.
@Resolver()
export class TaxGroupsResolver {
  private readonly logger = new Logger(TaxGroupsResolver.name);

  constructor(private readonly taxGroupsGatewayService: TaxGroupsGatewayService) {}

  // Options query for the Tax Group Select dropdown. The gateway `.select()` takes a plain
  // SelectOptionsQueryDto, so the shared input is forwarded as-is with a localized cast.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'taxGroupsOptions' })
  async taxGroupsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY taxGroupsOptions');
    return this.taxGroupsGatewayService.select((input ?? {}) as SelectOptionsQueryDto);
  }

  // All tax groups (with rates + canDelete) — the mobile Tax Groups list. Small/bounded, so a plain array.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => [TaxGroup], { name: 'taxGroups' })
  async taxGroups(@Args('search', { type: () => String, nullable: true }) search?: string): Promise<TaxGroup[]> {
    this.logger.log('QUERY taxGroups');
    return this.taxGroupsGatewayService.list(search);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => TaxGroup, { name: 'createTaxGroup' })
  async createTaxGroup(@Args('input') input: CreateTaxGroupInput): Promise<TaxGroup> {
    this.logger.log('MUTATION createTaxGroup');
    const result = await this.taxGroupsGatewayService.create(input);
    return result.data;
  }

  // Re-reads + returns the entity so Apollo auto-merges by id (the gateway update returns only success).
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
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
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteTaxGroup' })
  async deleteTaxGroup(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteTaxGroup');
    return this.taxGroupsGatewayService.delete(id);
  }
}
