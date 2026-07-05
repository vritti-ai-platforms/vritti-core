import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import type { SupplierItemsSelectQueryDto } from '../dto/request/supplier-items-select-query.dto';
import { SupplierItemsGatewayService } from '../services/supplier-items-gateway.service';

// GraphQL options query for the Supplier Item Select dropdown. Thin forward to the existing gateway
// `.select()` (which NATS-forwards to commerce-service). The service takes ONE merged DTO, so the shared
// `input` and the entity params (supplierId, excludeOnPurchaseOrderId, excludeOnGoodsReceiptId) are merged
// before forwarding.
@Resolver()
export class SupplierItemsResolver {
  private readonly logger = new Logger(SupplierItemsResolver.name);

  constructor(private readonly supplierItemsGatewayService: SupplierItemsGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'supplierItemsOptions' })
  async supplierItemsOptions(
    @Args('supplierId', { type: () => String, nullable: true }) supplierId?: string,
    @Args('excludeOnPurchaseOrderId', { type: () => String, nullable: true }) excludeOnPurchaseOrderId?: string,
    @Args('excludeOnGoodsReceiptId', { type: () => String, nullable: true }) excludeOnGoodsReceiptId?: string,
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY supplierItemsOptions');
    return this.supplierItemsGatewayService.select({
      ...(input ?? {}),
      supplierId,
      excludeOnPurchaseOrderId,
      excludeOnGoodsReceiptId,
    } as SupplierItemsSelectQueryDto);
  }
}
