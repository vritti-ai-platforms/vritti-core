import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession, type SelectOptionsQueryDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { InventoryItemQuantsGatewayService } from '../services/inventory-item-quants-gateway.service';

// GraphQL options query for the Quant Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service `selectQuants`). The entity scope `inventoryItemId` is a
// top-level @Args (separate from the shared input) and is merged into the query object here — the
// service signature requires it, so it's cast into the `& { inventoryItemId }` shape.
@Resolver()
export class InventoryItemQuantsResolver {
  private readonly logger = new Logger(InventoryItemQuantsResolver.name);

  constructor(private readonly inventoryItemQuantsGatewayService: InventoryItemQuantsGatewayService) {}

  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'inventoryItemQuantsOptions' })
  async inventoryItemQuantsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemQuantsOptions — inventoryItemId: ${inventoryItemId ?? 'all'}`);
    return this.inventoryItemQuantsGatewayService.select({ ...input, inventoryItemId } as SelectOptionsQueryDto & {
      inventoryItemId: string;
    });
  }
}
