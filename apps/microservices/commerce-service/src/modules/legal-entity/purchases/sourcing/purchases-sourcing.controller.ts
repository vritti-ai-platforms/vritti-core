import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { PurchaseSourcingItemDto } from '@/modules/site/purchases/sourcing/dto/entity/purchase-sourcing-item.dto';
import { PurchasesSourcingService } from '@/modules/site/purchases/sourcing/services/purchases-sourcing.service';

@Controller()
export class LePurchasesSourcingController {
  private readonly logger = new Logger(LePurchasesSourcingController.name);

  constructor(private readonly service: PurchasesSourcingService) {}

  // Returns a purchase's items with their allocations across every leg
  @MessagePattern({ cmd: 'le.purchases.sourcing.items' })
  items(@Payload() data: { id: string }): Promise<PurchaseSourcingItemDto[]> {
    this.logger.log(`le.purchases.sourcing.items — id: ${data.id}`);
    return this.service.findItems(data.id);
  }
}
