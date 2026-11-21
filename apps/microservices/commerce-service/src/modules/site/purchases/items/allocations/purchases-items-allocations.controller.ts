import { CreatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocations-from-quotation.dto';
import { UpdatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/update-purchase-allocation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseItemAllocationRowDto } from '@/modules/site/purchases/items/allocations/dto/entity/purchase-item-allocation-row.dto';
import { PurchasesAllocationsService } from './services/purchases-allocations.service';

@Controller()
export class PurchasesItemsAllocationsController {
  private readonly logger = new Logger(PurchasesItemsAllocationsController.name);

  constructor(private readonly service: PurchasesAllocationsService) {}

  // Allocates part of a purchase item to a supplier, opening its leg on the first allocation
  @MessagePattern({ cmd: 'site.purchases.items.allocations.create' })
  create(@Payload() dto: CreatePurchaseAllocationDto): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log(
      `site.purchases.items.allocations.create — id: ${dto.id}, item: ${dto.purchaseItemId}, supplier: ${dto.supplierId}`,
    );
    return this.service.create(dto);
  }

  // Allocates purchase items from posted quotation lines
  @MessagePattern({ cmd: 'site.purchases.items.allocations.createFromQuotation' })
  createFromQuotation(@Payload() dto: CreatePurchaseAllocationsFromQuotationDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.purchases.items.allocations.createFromQuotation — id: ${dto.id}, quotation: ${dto.supplierQuotationId ?? 'lines'}`,
    );
    return this.service.createFromQuotation(dto);
  }

  // Changes an allocation
  @MessagePattern({ cmd: 'site.purchases.items.allocations.update' })
  update(@Payload() dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.allocations.update — id: ${dto.id}, allocation: ${dto.allocationId}`);
    return this.service.update(dto);
  }
  // Returns one page of a purchase item's allocations, each with its supplier and leg state and what it became
  @MessagePattern({ cmd: 'site.purchases.items.allocations.table' })
  table(
    @Payload() data: { id: string; itemId: string } & TableState,
  ): Promise<{ result: PurchaseItemAllocationRowDto[]; count: number }> {
    const { id, itemId, ...state } = data;
    this.logger.log(`site.purchases.items.allocations.table — id: ${id}, item: ${itemId}`);
    return this.service.findForItemTable(id, itemId, state);
  }

  // Removes an allocation, removing its leg with the last one
  @MessagePattern({ cmd: 'site.purchases.items.allocations.delete' })
  delete(@Payload() data: { id: string; allocationId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.allocations.delete — id: ${data.id}, allocation: ${data.allocationId}`);
    return this.service.delete(data.id, data.allocationId);
  }
}
