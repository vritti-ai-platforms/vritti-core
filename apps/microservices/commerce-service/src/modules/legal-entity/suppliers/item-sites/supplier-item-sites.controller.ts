import type { SupplierItemSiteDto } from '@domain/supplier-items/dto/entity/supplier-item-site.dto';
import { AddSupplierItemSiteDto } from '@domain/supplier-items/dto/request/add-supplier-item-site.dto';
import { UpdateSupplierItemSiteDto } from '@domain/supplier-items/dto/request/update-supplier-item-site.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class SupplierItemSitesController {
  private readonly logger = new Logger(SupplierItemSitesController.name);

  constructor(private readonly service: SupplierItemsDomainService) {}

  // Returns the paginated per-site operational overrides of a supplier item
  @MessagePattern({ cmd: 'le.suppliers.itemSitesTable' })
  itemSitesTable(
    @Payload() data: { supplierItemId: string } & TableViewState,
  ): Promise<{ result: SupplierItemSiteDto[]; count: number }> {
    const { supplierItemId, ...state } = data;
    this.logger.log(`suppliers.itemSitesTable — supplierItemId: ${supplierItemId}`);
    return this.service.findItemSitesForTable(supplierItemId, state);
  }

  // Creates or replaces a per-site override for a supplier item
  @MessagePattern({ cmd: 'le.suppliers.addItemSite' })
  addItemSite(@Payload() dto: AddSupplierItemSiteDto): Promise<CreateResponseDto<SupplierItemSiteDto>> {
    this.logger.log(`suppliers.addItemSite — supplierItemId: ${dto.supplierItemId}, siteId: ${dto.siteId}`);
    return this.service.upsertItemSite(dto.supplierItemId, dto.siteId, {
      leadTimeDays: dto.leadTimeDays,
      minOrderQuantity: dto.minOrderQuantity,
    });
  }

  // Updates a per-site override by ID
  @MessagePattern({ cmd: 'le.suppliers.updateItemSite' })
  updateItemSite(@Payload() dto: UpdateSupplierItemSiteDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.updateItemSite — id: ${dto.id}`);
    return this.service.updateItemSite(dto.id, {
      leadTimeDays: dto.leadTimeDays,
      minOrderQuantity: dto.minOrderQuantity,
    });
  }

  // Deletes a per-site override by ID
  @MessagePattern({ cmd: 'le.suppliers.deleteItemSite' })
  deleteItemSite(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.deleteItemSite — id: ${data.id}`);
    return this.service.deleteItemSite(data.id);
  }
}
