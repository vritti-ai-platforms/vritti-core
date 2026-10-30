import { AddSupplierItemDto } from '@domain/supplier-items/dto/request/add-supplier-item.dto';
import { BulkSetSupplierItemLeadTimeDto } from '@domain/supplier-items/dto/request/bulk-set-supplier-item-lead-time.dto';
import { BulkSetSupplierItemMinOrderDto } from '@domain/supplier-items/dto/request/bulk-set-supplier-item-min-order.dto';
import { BulkSetSupplierItemPreferredDto } from '@domain/supplier-items/dto/request/bulk-set-supplier-item-preferred.dto';
import { UpdateSupplierItemDto } from '@domain/supplier-items/dto/request/update-supplier-item.dto';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDetailDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SuppliersItemsService } from './services/suppliers-items.service';

@Controller()
export class SuppliersItemsController {
  private readonly logger = new Logger(SuppliersItemsController.name);

  constructor(
    private readonly domainService: SupplierItemsDomainService,
    private readonly localService: SuppliersItemsService,
  ) {}

  @MessagePattern({ cmd: 'le.suppliers.itemsTable' })
  itemsTable(
    @Payload() data: { supplierId: string } & TableViewState,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    this.logger.log('suppliers.itemsTable');
    const { supplierId, ...state } = data;
    return this.domainService.findForTable(supplierId, state);
  }

  @MessagePattern({ cmd: 'le.suppliers.findItemById' })
  findItemById(@Payload() data: { supplierItemId: string }): Promise<SupplierItemDetailDto> {
    this.logger.log(`suppliers.findItemById — id: ${data.supplierItemId}`);
    return this.domainService.findItemDetail(data.supplierItemId);
  }

  @MessagePattern({ cmd: 'le.suppliers.addItem' })
  addItem(@Payload() data: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const { supplierId, ...itemData } = data;
    this.logger.log(`suppliers.addItem — item: ${itemData.inventoryItemId}`);
    return this.localService.addItem(supplierId, itemData);
  }

  @MessagePattern({ cmd: 'le.suppliers.updateItem' })
  updateItem(@Payload() data: UpdateSupplierItemDto): Promise<SuccessResponseDto> {
    const { supplierId, supplierItemId, ...itemData } = data;
    this.logger.log(`suppliers.updateItem — id: ${supplierItemId}`);
    return this.localService.updateItem(supplierId, supplierItemId, itemData);
  }

  @MessagePattern({ cmd: 'le.suppliers.unlinkItem' })
  unlinkItem(@Payload() data: { supplierId: string; supplierItemId: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.unlinkItem');
    return this.domainService.unlinkItem(data.supplierId, data.supplierItemId);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetItemPreferred' })
  bulkSetItemPreferred(@Payload() dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemPreferred');
    return this.domainService.bulkSetPreferred(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetItemMinOrder' })
  bulkSetItemMinOrder(@Payload() dto: BulkSetSupplierItemMinOrderDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemMinOrder');
    return this.domainService.bulkSetMinOrder(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetItemLeadTime' })
  bulkSetItemLeadTime(@Payload() dto: BulkSetSupplierItemLeadTimeDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemLeadTime');
    return this.domainService.bulkSetLeadTime(dto);
  }
}
