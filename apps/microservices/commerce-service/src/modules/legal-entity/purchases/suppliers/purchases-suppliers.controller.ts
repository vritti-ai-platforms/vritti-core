import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import type { PurchaseLegDto } from '@/modules/site/purchases/suppliers/dto/entity/purchase-leg.dto';
import { PurchasesSuppliersService } from '@/modules/site/purchases/suppliers/services/purchases-suppliers.service';

@Controller()
export class LePurchasesSuppliersController {
  private readonly logger = new Logger(LePurchasesSuppliersController.name);

  constructor(private readonly service: PurchasesSuppliersService) {}

  // Returns a purchase's supplier legs with their allocations, documents, progress and available actions, approval
  // thresholds in the legal entity's currency
  @MessagePattern({ cmd: 'le.purchases.suppliers.findByPurchase' })
  findByPurchase(@Payload() data: { id: string }, @RpcNatsHeaders() headers: NatsHeaders): Promise<PurchaseLegDto[]> {
    this.logger.log(`le.purchases.suppliers.findByPurchase — id: ${data.id}`);
    return this.service.findByPurchase(data.id, headers, headers.leCurrencyCode);
  }
}
