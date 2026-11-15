import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { PurchaseLegDto } from './dto/entity/purchase-leg.dto';
import { PurchasesSuppliersService } from './services/purchases-suppliers.service';

@Controller()
export class PurchasesSuppliersController {
  private readonly logger = new Logger(PurchasesSuppliersController.name);

  constructor(private readonly service: PurchasesSuppliersService) {}

  // Returns a purchase's supplier legs with their allocations, documents, progress and available actions
  @MessagePattern({ cmd: 'site.purchases.suppliers.findByPurchase' })
  findByPurchase(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<PurchaseLegDto[]> {
    this.logger.log(`site.purchases.suppliers.findByPurchase — id: ${data.id}`);
    return this.service.findByPurchase(data.id, headers, headers.leCurrencyCode);
  }
}
