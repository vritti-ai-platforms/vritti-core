import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import type { PurchaseOrderItemsSelectQueryDto } from '../dto/request/purchase-order-items-select-query.dto';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import { PurchaseOrderItemsGatewayService } from '../services/purchase-order-items-gateway.service';

// GraphQL options query for the Purchase Order Item Select dropdown. Thin forward to the existing gateway
// `.select()` (which NATS-forwards to commerce-service). The service takes ONE merged DTO, so the shared
// `input` and the entity params (purchaseOrderId, excludeOnGoodsReceiptId) are merged before forwarding.
@Resolver()
export class PurchaseOrderItemsResolver {
  private readonly logger = new Logger(PurchaseOrderItemsResolver.name);

  constructor(private readonly purchaseOrderItemsGatewayService: PurchaseOrderItemsGatewayService) {}

  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'purchaseOrderItemsOptions' })
  async purchaseOrderItemsOptions(
    @Args('purchaseOrderId', { type: () => String }) purchaseOrderId: string,
    @Args('excludeOnGoodsReceiptId', { type: () => String, nullable: true }) excludeOnGoodsReceiptId?: string,
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY purchaseOrderItemsOptions');
    return this.purchaseOrderItemsGatewayService.select({
      ...(input ?? {}),
      purchaseOrderId,
      excludeOnGoodsReceiptId,
    } as PurchaseOrderItemsSelectQueryDto);
  }
}
