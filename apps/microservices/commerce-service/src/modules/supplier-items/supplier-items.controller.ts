import type { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import type { LinkSupplierItemDto } from '@/modules/suppliers/dto/request/link-supplier-item.dto';

@Controller()
export class SupplierItemsController {
  private readonly logger = new Logger(SupplierItemsController.name);

  constructor(private readonly service: SupplierItemsService) {}

  @MessagePattern({ cmd: 'suppliers.itemsTable' })
  itemsTable(@Payload() data: { supplierId: string } & TableViewState): Promise<{ result: SupplierItemDto[]; count: number }> {
    this.logger.log(`suppliers.itemsTable — supplierId: ${data.supplierId}`);
    const { supplierId, ...state } = data;
    return this.service.findForTable(supplierId, state);
  }

  @MessagePattern({ cmd: 'suppliers.itemIds' })
  itemIds(@Payload() data: { supplierId: string }): Promise<string[]> {
    this.logger.log(`suppliers.itemIds — supplierId: ${data.supplierId}`);
    return this.service.findItemIds(data.supplierId);
  }

  @MessagePattern({ cmd: 'suppliers.linkItem' })
  linkItem(@Payload() data: { supplierId: string } & LinkSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const { supplierId, ...itemData } = data;
    this.logger.log(`suppliers.linkItem — supplierId: ${supplierId}`);
    return this.service.linkItem(supplierId, itemData);
  }

  @MessagePattern({ cmd: 'suppliers.unlinkItem' })
  unlinkItem(@Payload() data: { supplierId: string; supplierItemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.unlinkItem — supplierId: ${data.supplierId}, itemId: ${data.supplierItemId}`);
    return this.service.unlinkItem(data.supplierId, data.supplierItemId);
  }

  @MessagePattern({ cmd: 'suppliers.findItemPrice' })
  findItemPrice(@Payload() data: { supplierId: string; inventoryItemId: string }): Promise<{ unitPrice: number | null }> {
    this.logger.log(`suppliers.findItemPrice — supplierId: ${data.supplierId}, itemId: ${data.inventoryItemId}`);
    return this.service.findItemPrice(data.supplierId, data.inventoryItemId);
  }
}
