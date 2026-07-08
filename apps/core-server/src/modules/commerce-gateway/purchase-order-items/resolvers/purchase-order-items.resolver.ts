import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import type { PurchaseOrderItemsSelectQueryDto } from '../dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrderItemsGatewayService } from '../services/purchase-order-items-gateway.service';

@Resolver()
export class PurchaseOrderItemsResolver {
  private readonly logger = new Logger(PurchaseOrderItemsResolver.name);

  constructor(private readonly purchaseOrderItemsGatewayService: PurchaseOrderItemsGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
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
