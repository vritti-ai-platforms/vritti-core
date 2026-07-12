import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { AddSupplierItemDto } from './dto/request/add-supplier-item.dto';
import type { UpdateSupplierItemDto } from './dto/request/update-supplier-item.dto';
import { SuppliersItemsService } from './services/suppliers-items.service';

@Controller()
export class SuppliersItemsController {
  private readonly logger = new Logger(SuppliersItemsController.name);

  constructor(
    private readonly domainService: SupplierItemsService,
    private readonly localService: SuppliersItemsService,
  ) {}

  @MessagePattern({ cmd: 'site.suppliers.itemsTable' })
  itemsTable(
    @Payload() data: { supplierId: string } & TableViewState,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    this.logger.log('suppliers.itemsTable');
    const { supplierId, ...state } = data;
    return this.domainService.findForTable(supplierId, state);
  }

  @MessagePattern({ cmd: 'site.suppliers.itemIds' })
  itemIds(@Payload() data: { supplierId: string }): Promise<string[]> {
    this.logger.log('suppliers.itemIds');
    return this.domainService.findItemIds(data.supplierId);
  }

  @MessagePattern({ cmd: 'site.suppliers.addItem' })
  addItem(@Payload() data: { supplierId: string } & AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const { supplierId, ...itemData } = data;
    this.logger.log(`suppliers.addItem — item: ${itemData.inventoryItemId}`);
    return this.localService.addItem(supplierId, itemData);
  }

  @MessagePattern({ cmd: 'site.suppliers.updateItem' })
  updateItem(
    @Payload() data: { supplierId: string; supplierItemId: string } & UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    const { supplierId, supplierItemId, ...itemData } = data;
    this.logger.log(`suppliers.updateItem — id: ${supplierItemId}`);
    return this.localService.updateItem(supplierId, supplierItemId, itemData);
  }

  @MessagePattern({ cmd: 'site.suppliers.unlinkItem' })
  unlinkItem(@Payload() data: { supplierId: string; supplierItemId: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.unlinkItem');
    return this.domainService.unlinkItem(data.supplierId, data.supplierItemId);
  }

  @MessagePattern({ cmd: 'site.suppliers.bulkUnlinkItems' })
  bulkUnlinkItems(@Payload() data: { supplierId: string; supplierItemIds: string[] }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkUnlinkItems');
    return this.domainService.bulkUnlinkItems(data.supplierId, data.supplierItemIds);
  }

  @MessagePattern({ cmd: 'site.suppliers.bulkSetItemScheme' })
  bulkSetItemScheme(
    @Payload()
    data: {
      supplierId: string;
      supplierItemIds: string[];
      schemeBuyQty?: number | null;
      schemeFreeQty?: number | null;
      hasScheme: boolean;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemScheme');
    return this.domainService.bulkSetScheme(data.supplierId, data.supplierItemIds, {
      buyQty: data.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? false,
    });
  }

  @MessagePattern({ cmd: 'site.suppliers.bulkSetItemPreferred' })
  bulkSetItemPreferred(
    @Payload() data: { supplierId: string; supplierItemIds: string[]; isPreferred: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.bulkSetItemPreferred');
    return this.domainService.bulkSetPreferred(data.supplierId, data.supplierItemIds, data.isPreferred);
  }

  @MessagePattern({ cmd: 'site.suppliers.findItemPrice' })
  findItemPrice(
    @Payload() data: { supplierId: string; inventoryItemId: string; uomId: string },
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('suppliers.findItemPrice');
    return this.domainService.findItemPrice(data.supplierId, data.inventoryItemId, data.uomId);
  }
}
