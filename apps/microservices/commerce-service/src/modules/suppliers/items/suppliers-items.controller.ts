import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, CurrencyAmountDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import type { LinkSupplierItemDto } from './dto/request/link-supplier-item.dto';
import type { UpdateSupplierItemDto } from './dto/request/update-supplier-item.dto';
import { SuppliersItemsService } from './services/suppliers-items.service';

@Controller()
export class SuppliersItemsController {
  private readonly logger = new Logger(SuppliersItemsController.name);

  constructor(
    private readonly domainService: SupplierItemsService,
    private readonly localService: SuppliersItemsService,
  ) {}

  @MessagePattern({ cmd: 'suppliers.itemsTable' })
  itemsTable(
    @Payload() data: { supplierId: string } & TableViewState,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    this.logger.log('suppliers.itemsTable');
    const { supplierId, ...state } = data;
    return this.domainService.findForTable(supplierId, state);
  }

  @MessagePattern({ cmd: 'suppliers.itemIds' })
  itemIds(@Payload() data: { supplierId: string }): Promise<string[]> {
    this.logger.log('suppliers.itemIds');
    return this.domainService.findItemIds(data.supplierId);
  }

  @MessagePattern({ cmd: 'suppliers.linkItem' })
  linkItem(@Payload() data: { supplierId: string } & LinkSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const { supplierId, ...itemData } = data;
    this.logger.log(`suppliers.linkItem — item: ${itemData.inventoryItemId}`);
    return this.localService.linkItem(supplierId, itemData);
  }

  @MessagePattern({ cmd: 'suppliers.updateItem' })
  updateItem(
    @Payload() data: { supplierId: string; supplierItemId: string } & UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    const { supplierId, supplierItemId, ...itemData } = data;
    this.logger.log(`suppliers.updateItem — id: ${supplierItemId}`);
    return this.localService.updateItem(supplierId, supplierItemId, itemData);
  }

  @MessagePattern({ cmd: 'suppliers.unlinkItem' })
  unlinkItem(@Payload() data: { supplierId: string; supplierItemId: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.unlinkItem');
    return this.domainService.unlinkItem(data.supplierId, data.supplierItemId);
  }

  @MessagePattern({ cmd: 'suppliers.findItemPrice' })
  findItemPrice(
    @Payload() data: { supplierId: string; inventoryItemId: string },
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    this.logger.log('suppliers.findItemPrice');
    return this.domainService.findItemPrice(data.supplierId, data.inventoryItemId);
  }
}
