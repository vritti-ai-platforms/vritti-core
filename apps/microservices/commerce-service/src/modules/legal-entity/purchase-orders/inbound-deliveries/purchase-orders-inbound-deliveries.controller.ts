import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LePurchaseOrdersInboundDeliveriesController {
  private readonly logger = new Logger(LePurchaseOrdersInboundDeliveriesController.name);

  constructor(private readonly inboundDeliveriesService: InboundDeliveriesDomainService) {}

  // Returns one page of the inbound deliveries carrying a line of a purchase order
  @MessagePattern({ cmd: 'le.purchaseOrders.inboundDeliveries' })
  inboundDeliveries(
    @Payload() data: { purchaseOrderId: string } & TableState,
  ): Promise<{ result: InboundDeliveryDto[]; count: number }> {
    this.logger.log(`le.purchaseOrders.inboundDeliveries — id: ${data.purchaseOrderId}`);
    const { purchaseOrderId, ...state } = data;
    return this.inboundDeliveriesService.findForTable(state, { purchaseOrderId });
  }
}
