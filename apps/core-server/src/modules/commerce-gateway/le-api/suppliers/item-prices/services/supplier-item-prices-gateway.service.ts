import type { AddSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-supplier-item-price.dto';
import type { UpdateSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-supplier-item-price.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import type { SupplierItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-response.dto';
import type { SupplierItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-table-response.dto';
import { withDefaultPeriod } from '@commerce/supplier-item-prices/price-period';
import { Injectable, Logger } from '@nestjs/common';
import { ContextStateService } from '@vritti/api-sdk/context-state';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class SupplierItemPricesGatewayService {
  private readonly logger = new Logger(SupplierItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
    private readonly contextStateService: ContextStateService,
  ) {}

  // A supplier item's price timeline at the site in the table's context, each price named by the site or legal entity
  // that owns it
  async findItemPricesTable(
    supplierItemId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierItemPriceTableResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.table — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-supplier-item-${supplierItemId}-prices`,
    );
    const { result, count } = await this.nats.send<{ result: SupplierItemPriceResponseDto[]; count: number }>(
      'commerce',
      'le.suppliers.siteItems.prices.table',
      { supplierItemId, ...state },
    );
    return { result: await this.ownerNames.resolve(orgId, result), count, state, activeViewId };
  }

  // A supplier item's price windows in one currency, by site and named, at the history's saved context — its period,
  // currency and sites (when none are picked, every site the supplier is enrolled at or has prices of its own)
  async findItemPriceHistory(
    supplierItemId: string,
    userId: string,
    orgId: string,
  ): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.priceHistory — supplierItemId: ${supplierItemId}`);
    const context = await this.contextStateService.getContextState(
      userId,
      `commerce-le-supplier-item-${supplierItemId}-price-history`,
    );
    const { currency, sites } = await this.nats.send<SupplierItemPriceHistoryResponseDto>(
      'commerce',
      'le.suppliers.siteItems.prices.priceHistory',
      { supplierItemId, context: withDefaultPeriod(context) },
    );
    return { currency, sites: await this.ownerNames.withSiteNames(orgId, sites) };
  }

  // Adds a price record to a supplier item's timeline
  async addItemPrice(
    supplierItemId: string,
    dto: AddSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SupplierItemPriceResponseDto[]>> {
    this.logger.log(
      `le.suppliers.siteItems.prices.create — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`,
    );
    return this.nats.send('commerce', 'le.suppliers.siteItems.prices.create', { supplierItemId, ...dto });
  }

  // Updates a supplier item price record
  async updateItemPrice(priceId: string, dto: UpdateSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.update — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.siteItems.prices.update', { id: priceId, ...dto });
  }

  // Deletes a supplier item price record
  async deleteItemPrice(priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.prices.delete — id: ${priceId}`);
    return this.nats.send('commerce', 'le.suppliers.siteItems.prices.delete', { id: priceId });
  }
}
