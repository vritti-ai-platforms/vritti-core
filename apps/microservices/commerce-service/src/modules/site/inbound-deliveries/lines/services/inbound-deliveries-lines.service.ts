import type { AddInboundDeliveryLinesDto } from '@domain/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import type { UpdateInboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { InboundDeliveryLineWithDisplayDto } from '../dto/entity/inbound-delivery-line-with-display.dto';

@Injectable()
export class InboundDeliveriesLinesService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly linesService: InboundDeliveryLinesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Puts lines of confirmed POs on a delivery and settles its received status, in one transaction
  async addLines(dto: AddInboundDeliveryLinesDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(dto.inboundDeliveryId);
    const items = await this.linesService.findDeliverableOrThrow(
      delivery,
      dto.lines.map((line) => line.purchaseOrderItemId),
    );

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.addLines(delivery, dto, items);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }

  // Changes a line's quantity and settles the delivery's received status, in one transaction
  async updateLine(dto: UpdateInboundDeliveryLineDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(dto.inboundDeliveryId);
    const line = await this.linesService.findOnDeliveryOrThrow(delivery.id, dto.lineId);

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.updateLine(delivery, line, dto.quantity);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }

  // Returns one page of a delivery's lines, each primary-unit quantity also in its item's display unit
  async findForTable(
    inboundDeliveryId: string,
    state: TableState,
  ): Promise<{ result: InboundDeliveryLineWithDisplayDto[]; count: number }> {
    const { result, count } = await this.linesService.findForTable(inboundDeliveryId, state);
    return {
      result: result.map(({ displayUnitRatios, ...line }) => ({
        ...line,
        display: this.uomConversionsService.toDisplayUomQuantities(
          { primaryUomQty: line.primaryUomQty, receivedOnDeliveryPrimaryQty: line.receivedOnDeliveryPrimaryQty },
          displayUnitRatios,
        ),
      })),
      count,
    };
  }

  // Removes a line and settles the delivery's received status, in one transaction
  async removeLine(inboundDeliveryId: string, lineId: string): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(inboundDeliveryId);
    const line = await this.linesService.findOnDeliveryOrThrow(delivery.id, lineId);

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.removeLine(delivery, line);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }
}
