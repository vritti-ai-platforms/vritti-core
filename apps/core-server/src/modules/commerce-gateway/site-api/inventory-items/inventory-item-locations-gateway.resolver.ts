import { Logger } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemLocation, InventoryItemLocationConnection } from './graphql/inventory-item-location.type';
import {
  CreateInventoryItemLocationInput,
  UpdateInventoryItemLocationInput,
} from './graphql/inventory-item-location-mutation.input';
import { MutationResult } from './graphql/mutation-result.type';
import { SiteInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

// Per-inventory-item location configs (the mobile Locations tab) — a Relay offset feed (an item can be stocked
// in many locations) plus create/edit/delete. Thin GraphQL forwards to the existing gateway methods.
@Resolver()
export class InventoryItemLocationsResolver {
  private readonly logger = new Logger(InventoryItemLocationsResolver.name);

  constructor(private readonly inventoryItemsGatewayService: SiteInventoryItemsGatewayService) {}

  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Query(() => InventoryItemLocationConnection, { name: 'inventoryItemLocations' })
  async inventoryItemLocations(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<InventoryItemLocationConnection> {
    this.logger.log('QUERY inventoryItemLocations');
    return this.inventoryItemsGatewayService.findItemLocationsForFeed({ inventoryItemId, first, after });
  }

  // Returns the created entity so the client prepends it into the cached feed (no refetch).
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Mutation(() => InventoryItemLocation, { name: 'createInventoryItemLocation' })
  async createInventoryItemLocation(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('input') input: CreateInventoryItemLocationInput,
  ): Promise<InventoryItemLocation> {
    this.logger.log('MUTATION createInventoryItemLocation');
    const result = await this.inventoryItemsGatewayService.createItemLocation(inventoryItemId, input);
    return result.data;
  }

  // Update changes only reorderLevel; returns success — the client patches the cached entity by id.
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'updateInventoryItemLocation' })
  async updateInventoryItemLocation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInventoryItemLocationInput,
  ): Promise<MutationResult> {
    this.logger.log('MUTATION updateInventoryItemLocation');
    return this.inventoryItemsGatewayService.updateItemLocation(id, input);
  }

  // Deletes a config; the client evicts it from the cache by the id it already holds.
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteInventoryItemLocation' })
  async deleteInventoryItemLocation(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteInventoryItemLocation');
    return this.inventoryItemsGatewayService.deleteItemLocation(id);
  }
}
