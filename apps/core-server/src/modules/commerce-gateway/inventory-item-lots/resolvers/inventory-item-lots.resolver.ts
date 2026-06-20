import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import type { LotsSelectQueryDto } from '../dto/request/lots-select-query.dto';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { InventoryItemLotsGatewayService } from '../services/inventory-item-lots-gateway.service';

// GraphQL options query for the Lot Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service `selectLots`). The entity scope `inventoryItemId` is a
// top-level @Args (separate from the shared input) and is merged into the LotsSelectQueryDto here.
@Resolver()
export class InventoryItemLotsResolver {
  private readonly logger = new Logger(InventoryItemLotsResolver.name);

  constructor(private readonly inventoryItemLotsGatewayService: InventoryItemLotsGatewayService) {}

  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'inventoryItemLotsOptions' })
  async inventoryItemLotsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemLotsOptions — inventoryItemId: ${inventoryItemId ?? 'all'}`);
    return this.inventoryItemLotsGatewayService.select({ ...input, inventoryItemId } as LotsSelectQueryDto);
  }
}
