import type { PurchaseItemDto } from '@domain/purchase-items/dto/entity/purchase-item.dto';
import { CreatePurchaseItemDto } from '@domain/purchase-items/dto/request/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from '@domain/purchase-items/dto/request/update-purchase-item.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchasesItemsService } from './services/purchases-items.service';

@Controller()
export class PurchasesItemsController {
  private readonly logger = new Logger(PurchasesItemsController.name);

  constructor(private readonly service: PurchasesItemsService) {}

  // Adds a purchase item, or adds the quantity to the item already requested
  @MessagePattern({ cmd: 'site.purchases.items.create' })
  create(@Payload() dto: CreatePurchaseItemDto): Promise<CreateResponseDto<PurchaseItemDto>> {
    this.logger.log(`site.purchases.items.create — id: ${dto.id}, item: ${dto.inventoryItemId}`);
    return this.service.create(dto);
  }

  // Changes a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.update' })
  update(@Payload() dto: UpdatePurchaseItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.update — id: ${dto.id}, item: ${dto.itemId}`);
    return this.service.update(dto);
  }

  // Returns a purchase's items
  @MessagePattern({ cmd: 'site.purchases.items.findByPurchase' })
  findByPurchase(@Payload() data: { id: string }): Promise<PurchaseItemDto[]> {
    this.logger.log(`site.purchases.items.findByPurchase — id: ${data.id}`);
    return this.service.findByPurchase(data.id);
  }

  // Removes a purchase item
  @MessagePattern({ cmd: 'site.purchases.items.delete' })
  delete(@Payload() data: { id: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchases.items.delete — id: ${data.id}, item: ${data.itemId}`);
    return this.service.delete(data.id, data.itemId);
  }
}
