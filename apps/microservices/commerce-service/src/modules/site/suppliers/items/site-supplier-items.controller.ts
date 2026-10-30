import { UpdateSupplierItemSiteDto } from '@domain/supplier-items/dto/request/update-supplier-item-site.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SiteSupplierItemDetailDto, SiteSupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteSupplierItemsController {
  private readonly logger = new Logger(SiteSupplierItemsController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns a supplier's items for the site
  @MessagePattern({ cmd: 'site.suppliers.itemsTable' })
  itemsTable(
    @Payload() data: { supplierId: string } & TableViewState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: SiteSupplierItemDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.itemsTable — supplierId: ${supplierId}`);
    return this.service.findSiteItemsForTable(supplierId, siteId, state);
  }

  // Returns a supplier item's detail with the site's price and min order
  @MessagePattern({ cmd: 'site.suppliers.findItemById' })
  findItemById(
    @Payload() data: { supplierItemId: string },
    @RpcSiteId() siteId: string,
  ): Promise<SiteSupplierItemDetailDto> {
    this.logger.log(`site.suppliers.findItemById — id: ${data.supplierItemId}`);
    return this.service.findSiteItemDetail(data.supplierItemId, siteId);
  }

  // Updates the caller site's terms for a supplier item; RLS limits the row to this site
  @MessagePattern({ cmd: 'site.suppliers.updateItemSite' })
  updateItemSite(@Payload() dto: UpdateSupplierItemSiteDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.updateItemSite — id: ${dto.id}`);
    return this.service.updateItemSite(dto);
  }
}
