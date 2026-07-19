import type { SupplierItemPriceDto } from '@domain/supplier-items/dto/entity/supplier-item-price.dto';
import { AddSiteSupplierItemPriceDto } from '@domain/supplier-items/dto/request/add-site-supplier-item-price.dto';
import { UpdateSiteSupplierItemPriceDto } from '@domain/supplier-items/dto/request/update-site-supplier-item-price.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDetailDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import { SiteSuppliersService } from '../root/services/site-suppliers.service';

@Controller()
export class SiteSupplierItemsController {
  private readonly logger = new Logger(SiteSupplierItemsController.name);

  constructor(
    private readonly service: SupplierItemsDomainService,
    private readonly siteService: SiteSuppliersService,
  ) {}

  // Returns a supplier's items for the site (requires the supplier be enrolled here)
  @MessagePattern({ cmd: 'site.suppliers.itemsTable' })
  itemsTable(
    @Payload() data: { supplierId: string } & TableViewState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.itemsTable — supplierId: ${supplierId}`);
    return this.siteService.listItems(supplierId, siteId, state);
  }

  // Returns a supplier item's detail with the resolved current price for the site
  @MessagePattern({ cmd: 'site.suppliers.findItemById' })
  findItemById(@Payload() data: { supplierItemId: string }): Promise<SupplierItemDetailDto> {
    this.logger.log(`site.suppliers.findItemById — id: ${data.supplierItemId}`);
    return this.service.findItemDetail(data.supplierItemId);
  }

  // Returns a supplier item's price timeline scoped to the site (general + own site rows)
  @MessagePattern({ cmd: 'site.suppliers.itemPricesTable' })
  itemPricesTable(
    @Payload() data: { supplierItemId: string } & TableViewState,
  ): Promise<{ result: SupplierItemPriceDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`site.suppliers.itemPricesTable — supplierItemId: ${supplierItemId}`);
    return this.service.findPricesForTable(supplierItemId, state);
  }

  // Adds a site-specific price row (site_id assigned by the DB GUC default)
  @MessagePattern({ cmd: 'site.suppliers.addItemPrice' })
  addItemPrice(@Payload() dto: AddSiteSupplierItemPriceDto): Promise<CreateResponseDto<SupplierItemPriceDto>> {
    this.logger.log(`site.suppliers.addItemPrice — supplierItemId: ${dto.supplierItemId}, validFrom: ${dto.validFrom}`);
    return this.service.addPrice(dto);
  }

  // Updates a site-specific price row after verifying it belongs to the caller's site
  @MessagePattern({ cmd: 'site.suppliers.updateItemPrice' })
  updateItemPrice(
    @Payload() dto: UpdateSiteSupplierItemPriceDto,
    @RpcSiteId() siteId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemPrice — id: ${dto.id}`);
    return this.siteService.updatePrice(dto, siteId);
  }

  // Deletes a site-specific price row after verifying it belongs to the caller's site
  @MessagePattern({ cmd: 'site.suppliers.deleteItemPrice' })
  deleteItemPrice(@Payload() data: { id: string }, @RpcSiteId() siteId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.deleteItemPrice — id: ${data.id}`);
    return this.siteService.deletePrice(data.id, siteId);
  }

  // Resolves the site-aware price for a (supplier, item, uom) — fixes the site PO prefill
  @MessagePattern({ cmd: 'site.suppliers.findItemPrice' })
  findItemPrice(
    @Payload() data: { supplierId: string; inventoryItemId: string; uomId: string },
  ): Promise<{ unitPrice: CurrencyAmountDto | null; schemeBuyQty: number | null; schemeFreeQty: number | null }> {
    this.logger.log('site.suppliers.findItemPrice');
    return this.service.findItemPrice(data.supplierId, data.inventoryItemId, data.uomId);
  }
}
