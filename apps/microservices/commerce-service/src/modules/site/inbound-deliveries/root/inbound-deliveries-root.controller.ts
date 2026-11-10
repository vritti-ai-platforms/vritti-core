import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import { CreateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import { ReceiveInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/receive-inbound-delivery.dto';
import { SetInboundDeliveryStatusDto } from '@domain/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import { UpdateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcSiteId } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliveriesService } from './services/inbound-deliveries-root.service';

@Controller()
export class InboundDeliveriesRootController {
  private readonly logger = new Logger(InboundDeliveriesRootController.name);

  constructor(
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly service: InboundDeliveriesService,
  ) {}

  // Returns one page of the site's inbound deliveries
  @MessagePattern({ cmd: 'site.inboundDeliveries.table' })
  table(@Payload() state: TableState): Promise<{ result: InboundDeliveryDto[]; count: number }> {
    this.logger.log('site.inboundDeliveries.table');
    return this.deliveriesService.findForTable(state);
  }

  // Returns one inbound delivery
  @MessagePattern({ cmd: 'site.inboundDeliveries.findById' })
  findById(@Payload() data: { id: string }): Promise<InboundDeliveryDto> {
    this.logger.log(`site.inboundDeliveries.findById — id: ${data.id}`);
    return this.deliveriesService.findById(data.id);
  }

  // Creates a planned inbound delivery of a supplier at the site
  @MessagePattern({ cmd: 'site.inboundDeliveries.create' })
  create(
    @Payload() dto: CreateInboundDeliveryDto,
    @RpcSiteId() siteId: string,
  ): Promise<CreateResponseDto<InboundDeliveryDto>> {
    this.logger.log(`site.inboundDeliveries.create — supplier: ${dto.supplierId}`);
    return this.service.create(dto, siteId);
  }

  // Changes an inbound delivery's expected date, carrier, tracking number, supplier's delivery note or notes
  @MessagePattern({ cmd: 'site.inboundDeliveries.update' })
  update(@Payload() dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Moves an inbound delivery to in transit, arrived or cancelled
  @MessagePattern({ cmd: 'site.inboundDeliveries.setStatus' })
  setStatus(@Payload() dto: SetInboundDeliveryStatusDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.setStatus — id: ${dto.id}, status: ${dto.status}`);
    return this.service.setStatus(dto);
  }

  // Creates a draft goods receipt pre-filled with the inbound delivery's open lines
  @MessagePattern({ cmd: 'site.inboundDeliveries.receive' })
  receive(@Payload() dto: ReceiveInboundDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`site.inboundDeliveries.receive — id: ${dto.id}`);
    return this.service.receive(dto);
  }

  // Deletes a planned inbound delivery without lines
  @MessagePattern({ cmd: 'site.inboundDeliveries.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.inboundDeliveries.delete — id: ${data.id}`);
    return this.deliveriesService.delete(data.id);
  }
}
