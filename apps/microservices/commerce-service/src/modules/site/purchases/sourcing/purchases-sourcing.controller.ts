import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { PurchaseSourcingItemDto } from './dto/entity/purchase-sourcing-item.dto';
import { PurchasesSourcingService } from './services/purchases-sourcing.service';

@Controller()
export class PurchasesSourcingController {
  private readonly logger = new Logger(PurchasesSourcingController.name);

  constructor(private readonly service: PurchasesSourcingService) {}

  // Returns a purchase's items with their allocations across every leg
  @MessagePattern({ cmd: 'site.purchases.sourcing.items' })
  items(@Payload() data: { id: string }): Promise<PurchaseSourcingItemDto[]> {
    this.logger.log(`site.purchases.sourcing.items — id: ${data.id}`);
    return this.service.findItems(data.id);
  }
}
