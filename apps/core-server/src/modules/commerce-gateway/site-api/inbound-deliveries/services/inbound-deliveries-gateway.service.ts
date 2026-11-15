import type { AddInboundDeliveryLinesDto } from '@commerce/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import type { CreateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import type { SetInboundDeliveryStatusDto } from '@commerce/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import type { UpdateInboundDeliveryDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import type { UpdateInboundDeliveryLineDto } from '@commerce/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import type { InboundDeliveryLineResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-response.dto';
import type { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { InboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class InboundDeliveriesGatewayService {
  private readonly logger = new Logger(InboundDeliveriesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Creates a planned inbound delivery of a supplier at the site
  create(dto: CreateInboundDeliveryDto): Promise<CreateResponseDto<InboundDeliveryResponseDto>> {
    this.logger.log(`site.inboundDeliveries.create — supplierId: ${dto.supplierId}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.create', dto);
  }

  // Puts purchase order lines on an inbound delivery
  addLines(inboundDeliveryId: string, dto: AddInboundDeliveryLinesDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.inboundDeliveries.lines.add — inboundDeliveryId: ${inboundDeliveryId}, lines: ${dto.lines.length}`,
    );
    return this.nats.send('commerce', 'site.inboundDeliveries.lines.add', { inboundDeliveryId, ...dto });
  }

  // Changes an inbound delivery's expected date, carrier, tracking number, supplier's delivery note or notes
  update(id: string, dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.update — id: ${id}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.update', { id, ...dto });
  }

  // Changes the quantity of an inbound delivery line
  updateLine(
    inboundDeliveryId: string,
    lineId: string,
    dto: UpdateInboundDeliveryLineDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.lines.update — inboundDeliveryId: ${inboundDeliveryId}, lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.lines.update', { inboundDeliveryId, lineId, ...dto });
  }

  // Moves an inbound delivery to in transit, arrived or cancelled
  setStatus(id: string, dto: SetInboundDeliveryStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.setStatus — id: ${id}, status: ${dto.status}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.setStatus', { id, ...dto });
  }

  // Returns one inbound delivery
  findById(id: string): Promise<InboundDeliveryResponseDto> {
    this.logger.log(`site.inboundDeliveries.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.findById', { id });
  }

  // Returns the site's inbound deliveries for the data table with server-stored state
  async findForTable(userId: string): Promise<InboundDeliveryTableResponseDto> {
    this.logger.log('site.inboundDeliveries.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      'commerce-site-inbound-deliveries',
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryResponseDto[]; count: number }>(
      'commerce',
      'site.inboundDeliveries.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // Returns an inbound delivery's lines for the data table with server-stored state
  async findLinesTable(inboundDeliveryId: string, userId: string): Promise<InboundDeliveryLineTableResponseDto> {
    this.logger.log(`site.inboundDeliveries.lines.table — inboundDeliveryId: ${inboundDeliveryId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-site-inbound-delivery-${inboundDeliveryId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryLineResponseDto[]; count: number }>(
      'commerce',
      'site.inboundDeliveries.lines.table',
      { inboundDeliveryId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Deletes a planned inbound delivery without lines
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.delete', { id });
  }

  // Removes a line from an inbound delivery
  removeLine(inboundDeliveryId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.lines.remove — inboundDeliveryId: ${inboundDeliveryId}, lineId: ${lineId}`);
    return this.nats.send('commerce', 'site.inboundDeliveries.lines.remove', { inboundDeliveryId, lineId });
  }
}
