import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { InboundDeliveryLineWithDisplayDto } from '@/modules/site/inbound-deliveries/lines/dto/entity/inbound-delivery-line-with-display.dto';
import { InboundDeliveriesLinesService } from '@/modules/site/inbound-deliveries/lines/services/inbound-deliveries-lines.service';

@Controller()
export class LeInboundDeliveriesLinesController {
  private readonly logger = new Logger(LeInboundDeliveriesLinesController.name);

  constructor(private readonly service: InboundDeliveriesLinesService) {}

  // Returns one page of the lines of an inbound delivery of the legal entity's sites
  @MessagePattern({ cmd: 'le.inboundDeliveries.lines.table' })
  table(
    @Payload() data: { inboundDeliveryId: string } & TableState,
  ): Promise<{ result: InboundDeliveryLineWithDisplayDto[]; count: number }> {
    this.logger.log(`le.inboundDeliveries.lines.table — inboundDeliveryId: ${data.inboundDeliveryId}`);
    const { inboundDeliveryId, ...state } = data;
    return this.service.findForTable(inboundDeliveryId, state);
  }
}
