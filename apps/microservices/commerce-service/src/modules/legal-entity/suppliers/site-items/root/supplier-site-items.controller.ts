import type { SupplierSiteItemDto } from '@domain/supplier-items/dto/entity/supplier-site-item.dto';
import { AddSupplierSiteItemDto } from '@domain/supplier-items/dto/request/add-supplier-site-item.dto';
import { BulkSetSupplierSiteItemPreferredDto } from '@domain/supplier-items/dto/request/bulk-set-supplier-site-item-preferred.dto';
import { UpdateSupplierSiteItemDto } from '@domain/supplier-items/dto/request/update-supplier-site-item.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SupplierSiteItemsController {
  private readonly logger = new Logger(SupplierSiteItemsController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns the paginated site items of a supplier item
  @MessagePattern({ cmd: 'le.suppliers.siteItems.table' })
  table(
    @Payload() data: { supplierItemId: string } & TableState,
  ): Promise<{ result: SupplierSiteItemDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`le.suppliers.siteItems.table — supplierItemId: ${supplierItemId}`);
    return this.service.findSiteItemsForTable(supplierItemId, state);
  }

  // Sets a supplier item up at a site
  @MessagePattern({ cmd: 'le.suppliers.siteItems.create' })
  create(@Payload() dto: AddSupplierSiteItemDto): Promise<CreateResponseDto<SupplierSiteItemDto>> {
    this.logger.log(`le.suppliers.siteItems.create — supplierItemId: ${dto.supplierItemId}, siteId: ${dto.siteId}`);
    return this.service.createSiteItem(dto);
  }

  // Updates a supplier item's settings at one site
  @MessagePattern({ cmd: 'le.suppliers.siteItems.update' })
  update(@Payload() dto: UpdateSupplierSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.update — id: ${dto.id}`);
    return this.service.updateSiteItem(dto);
  }

  // Removes a supplier item from a site
  @MessagePattern({ cmd: 'le.suppliers.siteItems.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.suppliers.siteItems.delete — id: ${data.id}`);
    return this.service.deleteSiteItem(data.id);
  }

  // Marks supplier items preferred (or not) at the chosen sites
  @MessagePattern({ cmd: 'le.suppliers.siteItems.bulkSetPreferred' })
  bulkSetPreferred(@Payload() dto: BulkSetSupplierSiteItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('le.suppliers.siteItems.bulkSetPreferred');
    return this.service.bulkSetSiteItemsPreferred(dto);
  }
}
