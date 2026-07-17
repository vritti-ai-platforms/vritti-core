import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { AddSupplierItemDto } from './dto/request/add-supplier-item.dto';
import { BulkSetSupplierItemPreferredDto } from './dto/request/bulk-set-supplier-item-preferred.dto';
import { BulkSetSupplierItemSchemeDto } from './dto/request/bulk-set-supplier-item-scheme.dto';
import { BulkUnlinkSupplierItemsDto } from './dto/request/bulk-unlink-supplier-items.dto';
import { UpdateSupplierItemDto } from './dto/request/update-supplier-item.dto';
import { SuppliersItemsService } from './services/suppliers-items.service';

@Controller()
export class SuppliersItemsController {
  private readonly logger = new Logger(SuppliersItemsController.name);

  constructor(
    private readonly domainService: SupplierItemsService,
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

  @MessagePattern({ cmd: 'le.suppliers.itemIds' })
  itemIds(@Payload() data: { supplierId: string }): Promise<string[]> {
    this.logger.log('suppliers.itemIds');
    return this.domainService.findItemIds(data.supplierId);
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

  @MessagePattern({ cmd: 'le.suppliers.bulkUnlinkItems' })
  bulkUnlinkItems(@Payload() dto: BulkUnlinkSupplierItemsDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkUnlinkItems');
    return this.domainService.bulkUnlinkItems(dto.supplierId, dto.supplierItemIds);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetItemScheme' })
  bulkSetItemScheme(@Payload() dto: BulkSetSupplierItemSchemeDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemScheme');
    return this.domainService.bulkSetScheme(dto.supplierId, dto.supplierItemIds, {
      buyQty: dto.schemeBuyQty ?? null,
      freeQty: dto.schemeFreeQty ?? null,
      hasScheme: dto.hasScheme ?? false,
    });
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetItemPreferred' })
  bulkSetItemPreferred(@Payload() dto: BulkSetSupplierItemPreferredDto): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemPreferred');
    return this.domainService.bulkSetPreferred(dto.supplierId, dto.supplierItemIds, dto.isPreferred);
  }

  @MessagePattern({ cmd: 'le.suppliers.findItemPrice' })
  findItemPrice(
    @Payload() data: { supplierId: string; inventoryItemId: string; uomId: string },
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('suppliers.findItemPrice');
    return this.domainService.findItemPrice(data.supplierId, data.inventoryItemId, data.uomId);
  }
}
