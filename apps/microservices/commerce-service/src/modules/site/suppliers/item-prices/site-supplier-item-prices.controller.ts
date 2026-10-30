import type { SupplierItemPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { SupplierItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { AddSiteSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/add-site-supplier-item-price.dto';
import { UpdateSiteSupplierItemPriceDto } from '@domain/supplier-item-prices/dto/request/update-site-supplier-item-price.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type NatsHeaders, RpcNatsHeaders, RpcSiteId } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteSupplierItemPricesController {
  private readonly logger = new Logger(SiteSupplierItemPricesController.name);

  constructor(private readonly service: SupplierItemPricesDomainService) {}

  // Returns a supplier item's price timeline for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.itemPricesTable' })
  itemPricesTable(
    @Payload() data: { supplierItemId: string } & TableViewState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`site.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    return this.service.findPricesForTable(supplierItemId, siteId, state);
  }

  // Returns the caller site's price windows for a supplier item, optionally narrowed to a date range
  @MessagePattern({ cmd: 'site.suppliers.itemPriceHistory' })
  itemPriceHistory(
    @Payload() data: { supplierItemId: string; from?: string; to?: string },
    @RpcSiteId() siteId: string,
  ): Promise<SupplierItemPriceHistoryDto> {
    const { supplierItemId, ...range } = data;
    this.logger.log(`site.suppliers.itemPriceHistory — supplierItemId: ${supplierItemId}`);
    return this.service.findPriceHistory(supplierItemId, { ...range, siteIds: [siteId] });
  }

  // Adds a price row for the caller's site
  @MessagePattern({ cmd: 'site.suppliers.addItemPrice' })
  addItemPrice(
    @Payload() dto: AddSiteSupplierItemPriceDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<SupplierItemPriceDto[]>> {
    this.logger.log(`site.suppliers.addItemPrice — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.service.addPrice(dto, [headers.siteId], headers.userId || null);
  }

  // Updates a price row of the caller's site; RLS hides other sites' rows
  @MessagePattern({ cmd: 'site.suppliers.updateItemPrice' })
  updateItemPrice(@Payload() dto: UpdateSiteSupplierItemPriceDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemPrice — id: ${dto.id}`);
    return this.service.updatePrice(dto);
  }

  // Deletes a future price row of the caller's site; RLS hides other sites' rows
  @MessagePattern({ cmd: 'site.suppliers.deleteItemPrice' })
  deleteItemPrice(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.deleteItemPrice — id: ${data.id}`);
    return this.service.deletePrice(data.id);
  }

  // Resolves the site-aware price for a (supplier, item, uom) — fixes the site PO prefill
  @MessagePattern({ cmd: 'site.suppliers.findItemPrice' })
  findItemPrice(
    @Payload() data: { supplierId: string; inventoryItemId: string; uomId: string },
    @RpcSiteId() siteId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null; schemeBuyQty: number | null; schemeFreeQty: number | null }> {
    this.logger.log('site.suppliers.findItemPrice');
    return this.service.findItemPrice(data.supplierId, data.inventoryItemId, data.uomId, siteId);
  }
}
