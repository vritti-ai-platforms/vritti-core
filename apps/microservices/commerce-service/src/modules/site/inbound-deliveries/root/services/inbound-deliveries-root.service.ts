import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import type { CreateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import type { ReceiveInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/receive-inbound-delivery.dto';
import type { SetInboundDeliveryStatusDto } from '@domain/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import type { UpdateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import { InboundDeliveriesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import { InboundDeliveryLinesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-delivery-lines.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { SupplierEnrollmentsDomainRepository } from '@domain/supplier-enrollments/repositories/supplier-enrollments.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsService } from '@/modules/site/goods-receipts/root/services/goods-receipts-root.service';

@Injectable()
export class InboundDeliveriesService {
  private readonly logger = new Logger(InboundDeliveriesService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveriesRepository: InboundDeliveriesDomainRepository,
    private readonly linesRepository: InboundDeliveryLinesDomainRepository,
    private readonly purchaseOrderItemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly supplierEnrollmentsRepository: SupplierEnrollmentsDomainRepository,
    private readonly goodsReceiptsService: GoodsReceiptsService,
  ) {}

  // Creates a planned delivery of a supplier the site still buys from
  async create(dto: CreateInboundDeliveryDto, siteId: string): Promise<CreateResponseDto<InboundDeliveryDto>> {
    await this.supplierEnrollmentsRepository.assertPurchasable(dto.supplierId, siteId);
    this.logger.log(`inboundDeliveries.create — supplier: ${dto.supplierId}, site: ${siteId}`);
    return this.deliveriesService.create(dto);
  }

  // Changes a delivery's details, keeping the supplier's delivery note unique and not dated after the delivery, and moves the expected delivery of the PO lines it holds with its date
  async update(dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(dto.id);
    this.deliveriesRepository.assertEditable(delivery, 'Cannot Edit Delivery');
    this.deliveriesRepository.assertDeliveryNoteDate(
      delivery.source,
      dto.supplierDeliveryNoteDate === undefined ? delivery.supplierDeliveryNoteDate : dto.supplierDeliveryNoteDate,
      dto.expectedDeliveryDate ?? delivery.expectedDeliveryDate,
    );
    await this.deliveriesRepository.assertDeliveryNoteAvailable(
      delivery.supplierId,
      dto.supplierDeliveryNoteNumber,
      delivery.id,
    );
    const purchaseOrderItemIds = await this.linesRepository.findPurchaseOrderItemIds(delivery.id);
    return this.database.runInTransaction(async () => {
      const result = await this.deliveriesService.update(delivery, dto);
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(purchaseOrderItemIds);
      return result;
    });
  }

  // Moves a delivery along its manual workflow and re-dates the PO lines it holds, which a cancelled delivery no longer sets
  async setStatus(dto: SetInboundDeliveryStatusDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(dto.id);
    const purchaseOrderItemIds = await this.linesRepository.findPurchaseOrderItemIds(delivery.id);
    return this.database.runInTransaction(async () => {
      const result = await this.deliveriesService.setStatus(delivery, dto.status);
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(purchaseOrderItemIds);
      return result;
    });
  }

  // Creates a draft goods receipt of the delivery pre-filled with what is still open on each of its lines
  receive(dto: ReceiveInboundDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`inboundDeliveries.receive — delivery: ${dto.id}`);
    return this.goodsReceiptsService.createFromDelivery({
      inboundDeliveryId: dto.id,
      receivedDate: dto.receivedDate,
      notes: dto.notes,
    });
  }
}
