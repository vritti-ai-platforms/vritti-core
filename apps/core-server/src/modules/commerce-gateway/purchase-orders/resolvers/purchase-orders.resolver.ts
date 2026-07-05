import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import type { PurchaseOrderSelectQueryDto } from '../dto/request/purchase-order-select-query.dto';
import { PurchaseOrdersGatewayService } from '../services/purchase-orders-gateway.service';

// GraphQL options query for the Purchase Order Select dropdown. Thin forward to the existing gateway
// `.select()` (which NATS-forwards to commerce-service). Entity params (status / supplierId) merge into the
// same PurchaseOrderSelectQueryDto the service expects; buId flows via the NATS request context.
@Resolver()
export class PurchaseOrdersResolver {
  private readonly logger = new Logger(PurchaseOrdersResolver.name);

  constructor(private readonly purchaseOrdersGatewayService: PurchaseOrdersGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'purchaseOrdersOptions' })
  async purchaseOrdersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('supplierId', { type: () => ID, nullable: true }) supplierId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY purchaseOrdersOptions');
    return this.purchaseOrdersGatewayService.select({
      ...((input ?? {}) as PurchaseOrderSelectQueryDto),
      status,
      supplierId,
    });
  }
}
