import type { AddSiteSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/add-site-supplier-item-price.dto';
import type { SiteSupplierItemPriceHistoryQueryDto } from '@commerce/supplier-item-prices/dto/request/site-supplier-item-price-history-query.dto';
import type { UpdateSiteSupplierItemPriceDto } from '@commerce/supplier-item-prices/dto/request/update-site-supplier-item-price.dto';
import type { SiteSupplierItemPriceResponseDto } from '@commerce/supplier-item-prices/dto/response/site-supplier-item-price-response.dto';
import type { SiteSupplierItemPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/site-supplier-item-price-table-response.dto';
import type { SupplierItemPriceHistoryResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { type CurrencyAmountDto } from '@vritti/api-sdk/money';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteSupplierItemPricesGatewayService {
  private readonly logger = new Logger(SiteSupplierItemPricesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the resolved unit price for a supplier-item pair at this site
  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('site.suppliers.findItemPrice');
    return this.nats.send('commerce', 'site.suppliers.findItemPrice', { supplierId, inventoryItemId, uomId });
  }

  // Returns the price timeline visible to this site for a supplier item
  async findItemPricesTable(supplierItemId: string, userId: string): Promise<SiteSupplierItemPriceTableResponseDto> {
    this.logger.log(`site.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-supplier-item-${supplierItemId}-prices`,
    );

    const { result, count } = await this.nats.send<{ result: SiteSupplierItemPriceResponseDto[]; count: number }>(
      'commerce',
      'site.suppliers.itemPricesTable',
      { supplierItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds a site-specific price record to a supplier item's timeline
  async addItemPrice(
    supplierItemId: string,
    dto: AddSiteSupplierItemPriceDto,
  ): Promise<CreateResponseDto<SiteSupplierItemPriceResponseDto[]>> {
    this.logger.log(`site.suppliers.addItemPrice — supplierItemId: ${supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.nats.send('commerce', 'site.suppliers.addItemPrice', { supplierItemId, ...dto });
  }

  // Updates a site-specific supplier item price record
  async updateItemPrice(priceId: string, dto: UpdateSiteSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.updateItemPrice', { id: priceId, ...dto });
  }

  // Returns this site's price windows for a supplier item — unpaged, for charts
  async findItemPriceHistory(
    supplierItemId: string,
    query: SiteSupplierItemPriceHistoryQueryDto,
  ): Promise<SupplierItemPriceHistoryResponseDto> {
    this.logger.log(`site.suppliers.itemPriceHistory — supplierItemId: ${supplierItemId}`);
    return this.nats.send('commerce', 'site.suppliers.itemPriceHistory', { supplierItemId, ...query });
  }

  // Deletes a site-specific supplier item price record
  async deleteItemPrice(priceId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.deleteItemPrice — id: ${priceId}`);
    return this.nats.send('commerce', 'site.suppliers.deleteItemPrice', { id: priceId });
  }
}
