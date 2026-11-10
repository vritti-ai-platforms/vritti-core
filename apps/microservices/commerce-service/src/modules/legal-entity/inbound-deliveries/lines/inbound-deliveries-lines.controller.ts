import type { InboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery-line.dto';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LeInboundDeliveriesLinesController {
  private readonly logger = new Logger(LeInboundDeliveriesLinesController.name);

  constructor(private readonly linesService: InboundDeliveryLinesDomainService) {}

  // Returns one page of the lines of an inbound delivery of the legal entity's sites
  @MessagePattern({ cmd: 'le.inboundDeliveries.lines.table' })
  table(
    @Payload() data: { inboundDeliveryId: string } & TableState,
  ): Promise<{ result: InboundDeliveryLineDto[]; count: number }> {
    this.logger.log(`le.inboundDeliveries.lines.table — inboundDeliveryId: ${data.inboundDeliveryId}`);
    const { inboundDeliveryId, ...state } = data;
    return this.linesService.findForTable(inboundDeliveryId, state);
  }
}
