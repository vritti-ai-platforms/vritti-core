import { Module } from '@nestjs/common';
import { DeliverablePurchaseOrderItemsRepository } from './repositories/deliverable-purchase-order-items.repository';
import { InboundDeliveriesDomainRepository } from './repositories/inbound-deliveries.repository';
import { InboundDeliveryLinesDomainRepository } from './repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from './services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from './services/inbound-delivery-lines.service';

@Module({
  providers: [
    InboundDeliveriesDomainService,
    InboundDeliveryLinesDomainService,
    InboundDeliveriesDomainRepository,
    InboundDeliveryLinesDomainRepository,
    DeliverablePurchaseOrderItemsRepository,
  ],
  exports: [
    InboundDeliveriesDomainService,
    InboundDeliveryLinesDomainService,
    InboundDeliveriesDomainRepository,
    InboundDeliveryLinesDomainRepository,
    DeliverablePurchaseOrderItemsRepository,
  ],
})
export class InboundDeliveriesDomainModule {}
