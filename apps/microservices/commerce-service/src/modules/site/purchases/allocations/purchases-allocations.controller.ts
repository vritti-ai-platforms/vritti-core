import type { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import { CreatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocations-from-quotation.dto';
import { UpdatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/update-purchase-allocation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesAllocationsService } from './services/purchases-allocations.service';

@Controller()
export class PurchasesAllocationsController {
  private readonly logger = new Logger(PurchasesAllocationsController.name);

  constructor(private readonly service: PurchasesAllocationsService) {}

  // Allocates part of a purchase item to a supplier, opening its leg on the first allocation
  @MessagePattern({ cmd: 'site.purchases.allocations.create' })
  create(@Payload() dto: CreatePurchaseAllocationDto): Promise<CreateResponseDto<PurchaseAllocationDto>> {
    this.logger.log(
      `site.purchases.allocations.create — id: ${dto.id}, item: ${dto.purchaseItemId}, supplier: ${dto.supplierId}`,
    );
    return this.service.create(dto);
  }

  // Allocates purchase items from posted quotation lines
  @MessagePattern({ cmd: 'site.purchases.allocations.createFromQuotation' })
  createFromQuotation(@Payload() dto: CreatePurchaseAllocationsFromQuotationDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.purchases.allocations.createFromQuotation — id: ${dto.id}, quotation: ${dto.supplierQuotationId ?? 'lines'}`,
    );
    return this.service.createFromQuotation(dto);
  }

  // Changes an allocation
  @MessagePattern({ cmd: 'site.purchases.allocations.update' })
  update(@Payload() dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.allocations.update — id: ${dto.id}, allocation: ${dto.allocationId}`);
    return this.service.update(dto);
  }

  // Removes an allocation, removing its leg with the last one
  @MessagePattern({ cmd: 'site.purchases.allocations.delete' })
  delete(@Payload() data: { id: string; allocationId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.allocations.delete — id: ${data.id}, allocation: ${data.allocationId}`);
    return this.service.delete(data.id, data.allocationId);
  }
}
