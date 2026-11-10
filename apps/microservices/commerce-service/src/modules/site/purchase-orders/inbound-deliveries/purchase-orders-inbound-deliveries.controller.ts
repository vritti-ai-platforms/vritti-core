import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class PurchaseOrdersInboundDeliveriesController {
  private readonly logger = new Logger(PurchaseOrdersInboundDeliveriesController.name);

  constructor(private readonly inboundDeliveriesService: InboundDeliveriesDomainService) {}

  // Returns one page of the inbound deliveries carrying a line of a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.inboundDeliveries' })
  inboundDeliveries(
    @Payload() data: { purchaseOrderId: string } & TableState,
  ): Promise<{ result: InboundDeliveryDto[]; count: number }> {
    this.logger.log(`site.purchaseOrders.inboundDeliveries — id: ${data.purchaseOrderId}`);
    const { purchaseOrderId, ...state } = data;
    return this.inboundDeliveriesService.findForTable(state, { purchaseOrderId });
  }
}
