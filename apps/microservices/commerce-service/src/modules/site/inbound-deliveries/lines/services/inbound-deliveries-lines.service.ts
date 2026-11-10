import type { AddInboundDeliveryLinesDto } from '@domain/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import type { UpdateInboundDeliveryLineDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery-line.dto';
import { DeliverablePurchaseOrderItemsRepository } from '@domain/inbound-deliveries/repositories/deliverable-purchase-order-items.repository';
import { InboundDeliveriesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import { InboundDeliveryLinesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrdersDomainRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class InboundDeliveriesLinesService {
  private readonly logger = new Logger(InboundDeliveriesLinesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveriesRepository: InboundDeliveriesDomainRepository,
    private readonly linesService: InboundDeliveryLinesDomainService,
    private readonly linesRepository: InboundDeliveryLinesDomainRepository,
    private readonly deliverableRepository: DeliverablePurchaseOrderItemsRepository,
    private readonly purchaseOrdersRepository: PurchaseOrdersDomainRepository,
    private readonly purchaseOrderItemsRepository: PurchaseOrderItemsDomainRepository,
  ) {}

  // Puts PO lines on a delivery, confirms their sent orders and dates the lines by the delivery, in one transaction
  async addLines(dto: AddInboundDeliveryLinesDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(dto.inboundDeliveryId);
    const purchaseOrderItemIds = dto.lines.map((line) => line.purchaseOrderItemId);
    const items = await this.deliverableRepository.findDeliverableOrThrow(delivery, purchaseOrderItemIds);

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.addLines(delivery, dto, items);
      const confirmed = await this.purchaseOrdersRepository.confirmSentForItems(purchaseOrderItemIds);
      for (const po of confirmed)
        this.logger.log(`PO ${po.poNumber} confirmed by inbound delivery ${delivery.deliveryNumber}`);
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(purchaseOrderItemIds);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }

  // Changes a line's quantity and settles the delivery's received status and its PO line's date
  async updateLine(dto: UpdateInboundDeliveryLineDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(dto.inboundDeliveryId);
    const line = await this.linesRepository.findOnDeliveryOrThrow(delivery.id, dto.lineId);

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.updateLine(delivery, line, dto.quantity);
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates([line.purchaseOrderItemId]);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }

  // Removes a line and re-dates its PO line from the deliveries still holding it
  async removeLine(inboundDeliveryId: string, lineId: string): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(inboundDeliveryId);
    const line = await this.linesRepository.findOnDeliveryOrThrow(delivery.id, lineId);

    return this.database.runInTransaction(async () => {
      const result = await this.linesService.removeLine(delivery, line);
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates([line.purchaseOrderItemId]);
      await this.deliveriesService.syncReceiptStatus(delivery.id);
      return result;
    });
  }
}
