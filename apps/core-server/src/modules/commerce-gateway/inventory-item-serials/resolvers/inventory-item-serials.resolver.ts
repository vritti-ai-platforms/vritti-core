import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import type { SerialsSelectQueryDto } from '../dto/request/serials-select-query.dto';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { InventoryItemSerialsGatewayService } from '../services/inventory-item-serials-gateway.service';

// GraphQL options query for the Serial Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service `selectSerials`, AVAILABLE serials only). The entity scope
// `quantId` is a top-level @Args (separate from the shared input) and is merged into the DTO here.
@Resolver()
export class InventoryItemSerialsResolver {
  private readonly logger = new Logger(InventoryItemSerialsResolver.name);

  constructor(private readonly inventoryItemSerialsGatewayService: InventoryItemSerialsGatewayService) {}

  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'inventoryItemSerialsOptions' })
  async inventoryItemSerialsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('quantId', { type: () => ID, nullable: true }) quantId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemSerialsOptions — quantId: ${quantId ?? 'all'}`);
    return this.inventoryItemSerialsGatewayService.select({ ...input, quantId } as SerialsSelectQueryDto);
  }
}
