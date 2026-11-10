import type { InboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery-line.dto';
import { AddInboundDeliveryLinesDto } from '@domain/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import { UpdateInboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliveriesLinesService } from './services/inbound-deliveries-lines.service';

@Controller()
export class InboundDeliveriesLinesController {
  private readonly logger = new Logger(InboundDeliveriesLinesController.name);

  constructor(
    private readonly linesService: InboundDeliveryLinesDomainService,
    private readonly service: InboundDeliveriesLinesService,
  ) {}

  // Returns one page of an inbound delivery's lines
  @MessagePattern({ cmd: 'site.inboundDeliveries.lines.table' })
  table(
    @Payload() data: { inboundDeliveryId: string } & TableState,
  ): Promise<{ result: InboundDeliveryLineDto[]; count: number }> {
    this.logger.log(`site.inboundDeliveries.lines.table — inboundDeliveryId: ${data.inboundDeliveryId}`);
    const { inboundDeliveryId, ...state } = data;
    return this.linesService.findForTable(inboundDeliveryId, state);
  }

  // Puts purchase order lines on an inbound delivery
  @MessagePattern({ cmd: 'site.inboundDeliveries.lines.add' })
  add(@Payload() dto: AddInboundDeliveryLinesDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.inboundDeliveries.lines.add — inboundDeliveryId: ${dto.inboundDeliveryId}, lines: ${dto.lines.length}`,
    );
    return this.service.addLines(dto);
  }

  // Changes the quantity of an inbound delivery line
  @MessagePattern({ cmd: 'site.inboundDeliveries.lines.update' })
  update(@Payload() dto: UpdateInboundDeliveryLineDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.inboundDeliveries.lines.update — inboundDeliveryId: ${dto.inboundDeliveryId}, line: ${dto.lineId}`,
    );
    return this.service.updateLine(dto);
  }

  // Removes a line from an inbound delivery
  @MessagePattern({ cmd: 'site.inboundDeliveries.lines.remove' })
  remove(@Payload() data: { inboundDeliveryId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.inboundDeliveries.lines.remove — inboundDeliveryId: ${data.inboundDeliveryId}, line: ${data.lineId}`,
    );
    return this.service.removeLine(data.inboundDeliveryId, data.lineId);
  }
}
