import type { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import { CreatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocation.dto';
import { CreatePurchaseAllocationsFromQuotationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocations-from-quotation.dto';
import { UpdatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/update-purchase-allocation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesAllocationsService } from '@/modules/site/purchases/allocations/services/purchases-allocations.service';

@Controller()
export class LePurchasesAllocationsController {
  private readonly logger = new Logger(LePurchasesAllocationsController.name);

  constructor(private readonly service: PurchasesAllocationsService) {}

  // Allocates part of a purchase item to a supplier, opening its leg on the first allocation
  @MessagePattern({ cmd: 'le.purchases.allocations.create' })
  create(
    @Payload() dto: CreatePurchaseAllocationDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<CreateResponseDto<PurchaseAllocationDto>> {
    this.logger.log(
      `le.purchases.allocations.create — id: ${dto.id}, item: ${dto.purchaseItemId}, supplier: ${dto.supplierId}`,
    );
    return this.service.create(dto, headers);
  }

  // Allocates purchase items from posted quotation lines
  @MessagePattern({ cmd: 'le.purchases.allocations.createFromQuotation' })
  createFromQuotation(
    @Payload() dto: CreatePurchaseAllocationsFromQuotationDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.purchases.allocations.createFromQuotation — id: ${dto.id}, lines: ${dto.supplierQuotationItemIds.length}`,
    );
    return this.service.createFromQuotation(dto, headers);
  }

  // Changes an allocation
  @MessagePattern({ cmd: 'le.purchases.allocations.update' })
  update(
    @Payload() dto: UpdatePurchaseAllocationDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.allocations.update — id: ${dto.id}, allocation: ${dto.allocationId}`);
    return this.service.update(dto, headers);
  }

  // Removes an allocation, removing its leg with the last one
  @MessagePattern({ cmd: 'le.purchases.allocations.delete' })
  delete(
    @Payload() data: { id: string; allocationId: string },
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.allocations.delete — id: ${data.id}, allocation: ${data.allocationId}`);
    return this.service.delete(data.id, data.allocationId, headers);
  }
}
