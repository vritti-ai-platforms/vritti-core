import { Logger } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from '../graphql/inventory-item-mutation.input';
import { InventoryItem } from '../graphql/inventory-item.type';
import { FeedFilterInput, FeedSearchInput, FeedSortInput } from '../graphql/inventory-items-feed.input';
import { InventoryItemConnection } from '../graphql/inventory-items-feed.type';
import { MutationResult } from '../graphql/mutation-result.type';
import { InventoryItemsGatewayService } from '../services/inventory-items-gateway.service';

@Resolver()
export class InventoryItemsResolver {
  private readonly logger = new Logger(InventoryItemsResolver.name);

  constructor(private readonly inventoryItemsGatewayService: InventoryItemsGatewayService) {}

  // Keyset/cursor Relay connection for the mobile infinite feed (GraphQL-only — no REST route).
  // Relay args (first/after) + filters/search/sort drive the keyset query; the client merges pages
  // via relayStylePagination. Returns the connection forwarded from commerce-service.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => InventoryItemConnection, { name: 'inventoryItems' })
  async inventoryItems(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('filters', { type: () => [FeedFilterInput], nullable: true }) filters?: FeedFilterInput[],
    @Args('search', { type: () => FeedSearchInput, nullable: true }) search?: FeedSearchInput | null,
    @Args('sort', { type: () => [FeedSortInput], nullable: true }) sort?: FeedSortInput[],
  ): Promise<InventoryItemConnection> {
    this.logger.log('QUERY inventoryItems');
    return this.inventoryItemsGatewayService.findForFeed({
      filters,
      search,
      sort,
      limit: first ?? undefined,
      cursor: after ?? undefined,
    });
  }

  // Single inventory item — live detail screen + post-update re-fetch. Reuses the findById gateway.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => InventoryItem, { name: 'inventoryItem' })
  async inventoryItem(@Args('id', { type: () => ID }) id: string): Promise<InventoryItem> {
    this.logger.log('QUERY inventoryItem');
    return this.inventoryItemsGatewayService.findById(id);
  }

  // Creates an item; returns the created entity so the client inserts it into the cached connection.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => InventoryItem, { name: 'createInventoryItem' })
  async createInventoryItem(@Args('input') input: CreateInventoryItemInput): Promise<InventoryItem> {
    this.logger.log('MUTATION createInventoryItem');
    const result = await this.inventoryItemsGatewayService.create(input);
    return result.data;
  }

  // Updates an item; re-fetches + returns the entity so Apollo auto-merges by id (no list refetch).
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => InventoryItem, { name: 'updateInventoryItem' })
  async updateInventoryItem(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInventoryItemInput,
  ): Promise<InventoryItem> {
    this.logger.log('MUTATION updateInventoryItem');
    await this.inventoryItemsGatewayService.update(id, input);
    return this.inventoryItemsGatewayService.findById(id);
  }

  // Deletes an item; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteInventoryItem' })
  async deleteInventoryItem(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteInventoryItem');
    return this.inventoryItemsGatewayService.delete(id);
  }

  // GraphQL options query for the Inventory Item Select dropdown. Thin forward to the existing gateway
  // `.select(params, excludeOnSupplierId)` — note the second positional arg the gateway signature takes,
  // so `excludeOnSupplierId` is passed separately (not merged into input). buId flows via NATS context.
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'inventoryItemsOptions' })
  async inventoryItemsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('excludeOnSupplierId', { type: () => ID, nullable: true }) excludeOnSupplierId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY inventoryItemsOptions');
    return this.inventoryItemsGatewayService.select(
      (input ?? {}) as SelectOptionsQueryDto,
      excludeOnSupplierId,
    );
  }
}
