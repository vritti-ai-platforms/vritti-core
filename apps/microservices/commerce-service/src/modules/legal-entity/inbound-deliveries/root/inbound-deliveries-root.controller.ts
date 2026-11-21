import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import type { InboundDeliveryCountsDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery-counts.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';

@Controller()
export class LeInboundDeliveriesRootController {
  private readonly logger = new Logger(LeInboundDeliveriesRootController.name);

  constructor(private readonly deliveriesService: InboundDeliveriesDomainService) {}

  // Returns one inbound delivery of the legal entity's sites
  @MessagePattern({ cmd: 'le.inboundDeliveries.findById' })
  findById(@Payload() data: { id: string }): Promise<InboundDeliveryDto> {
    this.logger.log(`le.inboundDeliveries.findById — id: ${data.id}`);
    return this.deliveriesService.findById(data.id);
  }

  // Returns one page of the inbound deliveries of the legal entity's sites
  @MessagePattern({ cmd: 'le.inboundDeliveries.table' })
  table(@Payload() state: TableState): Promise<{ result: InboundDeliveryDto[]; count: number }> {
    this.logger.log('le.inboundDeliveries.table');
    return this.deliveriesService.findForTable(state);
  }

  // Counts an inbound delivery's lines, one per tab of its detail page
  @MessagePattern({ cmd: 'le.inboundDeliveries.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<InboundDeliveryCountsDto> {
    this.logger.log(`le.inboundDeliveries.findCounts — id: ${data.id}`);
    return this.deliveriesService.findCounts(data.id);
  }
}
