import type { PurchaseEventDto } from '@domain/purchase-events/dto/entity/purchase-event.dto';
import type { PurchaseEventsQueryDto } from '@domain/purchase-events/dto/request/purchase-events-query.dto';
import { PurchaseEventsDomainService } from '@domain/purchase-events/services/purchase-events.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchasesEventsService {
  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly eventsService: PurchaseEventsDomainService,
  ) {}

  // Returns one page of the events of a purchase in reach, newest first, narrowed to a kind and a leg when given
  async findByPurchase(query: PurchaseEventsQueryDto): Promise<{ result: PurchaseEventDto[]; count: number }> {
    const purchase = await this.purchasesService.findDetailOrThrow(query.id);
    return this.eventsService.findPageForPurchase(purchase.id, query);
  }
}
