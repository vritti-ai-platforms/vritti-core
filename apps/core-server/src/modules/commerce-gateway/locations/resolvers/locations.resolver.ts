import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../../_shared/graphql/select.input';
import { SelectOptions } from '../../_shared/graphql/select.type';
import type { LocationsSelectQueryDto } from '../dto/request/locations-select-query.dto';
import { LocationsGatewayService } from '../services/locations-gateway.service';

// GraphQL options query for the Location Select dropdown. Thin forward to the existing gateway `.select()`
// (which NATS-forwards to commerce-service). Entity params (locationRoles / inventoryItemId / goods-receipt
// exclusion scope) merge into the same LocationsSelectQueryDto the service expects; buId flows via NATS context.
@Resolver()
export class LocationsResolver {
  private readonly logger = new Logger(LocationsResolver.name);

  constructor(private readonly locationsGatewayService: LocationsGatewayService) {}

  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  @Query(() => SelectOptions, { name: 'locationsOptions' })
  async locationsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('locationRoles', { type: () => String, nullable: true }) locationRoles?: string,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
    @Args('excludeUsedOnGoodsReceiptItemId', { type: () => ID, nullable: true })
    excludeUsedOnGoodsReceiptItemId?: string,
    @Args('goodsReceiptLotId', { type: () => ID, nullable: true }) goodsReceiptLotId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY locationsOptions');
    return this.locationsGatewayService.select({
      ...((input ?? {}) as LocationsSelectQueryDto),
      locationRoles,
      inventoryItemId,
      excludeUsedOnGoodsReceiptItemId,
      goodsReceiptLotId,
    });
  }
}
