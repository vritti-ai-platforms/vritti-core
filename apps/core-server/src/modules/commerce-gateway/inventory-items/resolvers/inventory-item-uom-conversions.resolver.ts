import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemUomConversion } from '../graphql/inventory-item-uom-conversion.type';
import {
  CreateInventoryItemUomConversionInput,
  UpdateInventoryItemUomConversionInput,
} from '../graphql/inventory-item-uom-conversion-mutation.input';
import { MutationResult } from '../graphql/mutation-result.type';
import { InventoryItemsGatewayService } from '../services/inventory-items-gateway.service';

// Per-inventory-item UOM conversion overrides for the mobile detail tab. Thin GraphQL forwards to the
// existing gateway service (which proxies the commerce-service NATS handlers). The list is small/bounded,
// so it's a plain array (no Relay connection). buId flows via NATS context from @RequireSession.
@Resolver()
export class InventoryItemUomConversionsResolver {
  private readonly logger = new Logger(InventoryItemUomConversionsResolver.name);

  constructor(private readonly inventoryItemsGatewayService: InventoryItemsGatewayService) {}

  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => [InventoryItemUomConversion], { name: 'inventoryItemUomConversions' })
  async inventoryItemUomConversions(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
  ): Promise<InventoryItemUomConversion[]> {
    this.logger.log('QUERY inventoryItemUomConversions');
    return this.inventoryItemsGatewayService.findUomConversions(inventoryItemId);
  }

  // Returns the created entity so the client inserts it into the cached list (no refetch).
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => InventoryItemUomConversion, { name: 'createInventoryItemUomConversion' })
  async createInventoryItemUomConversion(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('input') input: CreateInventoryItemUomConversionInput,
  ): Promise<InventoryItemUomConversion> {
    this.logger.log('MUTATION createInventoryItemUomConversion');
    const result = await this.inventoryItemsGatewayService.createUomConversion(inventoryItemId, input);
    return result.data;
  }

  // Update changes only the ratio (primaryUomQty/uomQty); returns success — the client patches the cached
  // entity (qty + derived factors are computable client-side), no refetch.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'updateInventoryItemUomConversion' })
  async updateInventoryItemUomConversion(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInventoryItemUomConversionInput,
  ): Promise<MutationResult> {
    this.logger.log('MUTATION updateInventoryItemUomConversion');
    return this.inventoryItemsGatewayService.updateUomConversion(id, input);
  }

  // Deletes a conversion; the client evicts it from the cache by the id it already holds.
  @RequireSession(SessionTypeValues.MOBILE)
  @Mutation(() => MutationResult, { name: 'deleteInventoryItemUomConversion' })
  async deleteInventoryItemUomConversion(@Args('id', { type: () => ID }) id: string): Promise<MutationResult> {
    this.logger.log('MUTATION deleteInventoryItemUomConversion');
    return this.inventoryItemsGatewayService.deleteUomConversion(id);
  }
}
