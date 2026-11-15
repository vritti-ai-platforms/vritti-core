import type { PurchaseEventDto } from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseEventsQueryDto } from '@domain/purchase-events/dto/request/purchase-events-query.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PurchasesEventsService } from './services/purchases-events.service';

@Controller()
export class PurchasesEventsController {
  private readonly logger = new Logger(PurchasesEventsController.name);

  constructor(private readonly service: PurchasesEventsService) {}

  // Returns one page of a purchase's events, newest first
  @MessagePattern({ cmd: 'site.purchases.events.findByPurchase' })
  findByPurchase(@Payload() query: PurchaseEventsQueryDto): Promise<{ result: PurchaseEventDto[]; count: number }> {
    this.logger.log(
      `site.purchases.events.findByPurchase — id: ${query.id}, kind: ${query.kind ?? 'all'}, offset: ${query.offset}`,
    );
    return this.service.findByPurchase(query);
  }
}
