import type { SupplierSiteItemDetailDto } from '@domain/supplier-items/dto/entity/supplier-site-item-detail.dto';
import type { SupplierSiteItemRowDto } from '@domain/supplier-items/dto/entity/supplier-site-item-row.dto';
import { UpdateSupplierSiteItemDto } from '@domain/supplier-items/dto/request/update-supplier-site-item.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteSupplierSiteItemsController {
  private readonly logger = new Logger(SiteSupplierSiteItemsController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns a supplier's site items at the caller's site
  @MessagePattern({ cmd: 'site.suppliers.siteItems.table' })
  table(
    @Payload() data: { supplierId: string } & TableState,
    @RpcSiteId() siteId: string,
  ): Promise<{ result: SupplierSiteItemRowDto[]; count: number }> {
    const { supplierId, ...state } = data;
    this.logger.log(`site.suppliers.siteItems.table — supplierId: ${supplierId}`);
    return this.service.findSiteItemsAtSiteForTable(supplierId, siteId, state);
  }

  // Returns a supplier item's detail with the caller site's terms and price in force
  @MessagePattern({ cmd: 'site.suppliers.siteItems.findById' })
  findById(
    @Payload() data: { supplierItemId: string },
    @RpcSiteId() siteId: string,
  ): Promise<SupplierSiteItemDetailDto> {
    this.logger.log(`site.suppliers.siteItems.findById — supplierItemId: ${data.supplierItemId}`);
    return this.service.findSiteItemDetail(data.supplierItemId, siteId);
  }

  // Updates the caller site's terms for a supplier item; RLS limits the row to this site
  @MessagePattern({ cmd: 'site.suppliers.siteItems.update' })
  update(@Payload() dto: UpdateSupplierSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.suppliers.siteItems.update — id: ${dto.id}`);
    return this.service.updateSiteItem(dto);
  }
}
