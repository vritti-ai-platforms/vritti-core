import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { AddGoodsReceiptPurchaseOrderDto } from '@domain/goods-receipts/dto/request/add-goods-receipt-purchase-order.dto';
import type { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import type { CreateGoodsReceiptFromPurchaseOrdersDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-purchase-orders.dto';
import type { UpdateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/update-goods-receipt.dto';
import { GoodsReceiptsDomainRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { DeliverablePurchaseOrderItemsRepository } from '@domain/inbound-deliveries/repositories/deliverable-purchase-order-items.repository';
import { InboundDeliveriesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import { InboundDeliveryLinesDomainRepository } from '@domain/inbound-deliveries/repositories/inbound-delivery-lines.repository';
import { ReceivablePurchaseOrdersRepository } from '@domain/inbound-deliveries/repositories/receivable-purchase-orders.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { SupplierEnrollmentsDomainRepository } from '@domain/supplier-enrollments/repositories/supplier-enrollments.repository';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly goodsReceiptsRepository: GoodsReceiptsDomainRepository,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveriesRepository: InboundDeliveriesDomainRepository,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly deliveryLinesRepository: InboundDeliveryLinesDomainRepository,
    private readonly deliverableRepository: DeliverablePurchaseOrderItemsRepository,
    private readonly receivablePurchaseOrdersRepository: ReceivablePurchaseOrdersRepository,
    private readonly purchaseOrderItemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly supplierEnrollmentsRepository: SupplierEnrollmentsDomainRepository,
  ) {}

  // Creates a draft receipt of an announced delivery, pre-filled with what is still open on each of its lines
  async createFromDelivery(dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const delivery = await this.deliveriesRepository.findDetailOrThrow(dto.inboundDeliveryId);
    this.deliveriesRepository.assertReceivable(delivery);
    await this.supplierEnrollmentsRepository.assertPurchasable(delivery.supplierId, delivery.siteId);
    const lines = await this.deliveryLinesRepository.findReceivableOrThrow(delivery);

    this.logger.log(`goodsReceipts.createFromDelivery — ${delivery.deliveryNumber}, lines: ${lines.length}`);
    return this.database.runInTransaction(() =>
      this.goodsReceiptsService.createDraft({
        supplierId: delivery.supplierId,
        inboundDeliveryId: delivery.id,
        siteId: delivery.siteId,
        legalEntityId: delivery.legalEntityId,
        receivedDate: dto.receivedDate,
        notes: dto.notes,
        lines,
      }),
    );
  }

  // Creates an arrived inbound delivery of the supplier's POs, with the supplier's delivery note, and a draft receipt of it, both carrying every open line at its open quantity, in one transaction
  async createFromPurchaseOrders(
    dto: CreateGoodsReceiptFromPurchaseOrdersDto,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const purchaseOrders = await this.receivablePurchaseOrdersRepository.findReceivableOrThrow(
      dto.supplierId,
      dto.purchaseOrderIds,
    );
    const [{ siteId, legalEntityId, timezone }] = purchaseOrders;
    await this.supplierEnrollmentsRepository.assertPurchasable(dto.supplierId, siteId);
    await this.deliveriesRepository.assertDeliveryNoteAvailable(dto.supplierId, dto.supplierDeliveryNoteNumber);
    const lines = await this.deliverableRepository.findOpenOnPurchaseOrdersOrThrow(purchaseOrders);
    const deliveryNumber = await this.deliveriesRepository.generateDeliveryNumber();

    this.logger.log(
      `goodsReceipts.createFromPurchaseOrders — ${purchaseOrders.map((po) => po.poNumber).join(', ')}, lines: ${lines.length}`,
    );
    return this.database.runInTransaction(async () => {
      const delivery = await this.deliveriesService.createFromReceipt(
        {
          legalEntityId,
          siteId,
          supplierId: dto.supplierId,
          deliveryNumber,
          carrier: dto.carrier ?? null,
          trackingNumber: dto.trackingNumber ?? null,
          supplierDeliveryNoteNumber: dto.supplierDeliveryNoteNumber ?? null,
          supplierDeliveryNoteDate: dto.supplierDeliveryNoteDate ?? null,
          notes: dto.notes ?? null,
        },
        dto.receivedDate,
        timezone,
        lines,
      );
      const created = await this.goodsReceiptsService.createDraft({
        supplierId: dto.supplierId,
        inboundDeliveryId: delivery.id,
        siteId,
        legalEntityId,
        receivedDate: dto.receivedDate,
        notes: dto.notes,
        lines: lines.map(({ purchaseOrderItemId, inventoryItemId, uomId, quantity }) => ({
          purchaseOrderItemId,
          inventoryItemId,
          uomId,
          receivedQty: quantity,
        })),
      });
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(lines.map((line) => line.purchaseOrderItemId));
      return created;
    });
  }

  // Adds every open line of another PO of the supplier at the site to a draft receipt and the delivery it created, in one transaction
  async addPurchaseOrder(dto: AddGoodsReceiptPurchaseOrderDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(
      dto.goodsReceiptId,
      'Cannot Add Purchase Order',
    );
    this.goodsReceiptsRepository.assertTakesPurchaseOrders(receipt);
    const [purchaseOrder] = await this.receivablePurchaseOrdersRepository.findReceivableOrThrow(
      receipt.supplierId,
      [dto.purchaseOrderId],
      { siteId: receipt.siteId, goodsReceiptId: receipt.id },
    );
    const lines = await this.deliverableRepository.findOpenOnPurchaseOrdersOrThrow([purchaseOrder], 'purchaseOrderId');

    this.logger.log(`goodsReceipts.addPurchaseOrder — ${receipt.grNumber} + ${purchaseOrder.poNumber}`);
    return this.database.runInTransaction(async () => {
      await this.deliveryLinesService.mirrorReceiptAdditions(receipt.inboundDeliveryId, lines);
      const result = await this.itemsService.addPurchaseOrderLines(
        receipt,
        purchaseOrder.poNumber,
        lines.map(({ purchaseOrderItemId, inventoryItemId, uomId, quantity }) => ({
          purchaseOrderItemId,
          inventoryItemId,
          uomId,
          receivedQty: quantity,
        })),
      );
      await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(lines.map((line) => line.purchaseOrderItemId));
      return result;
    });
  }

  // Changes a draft receipt's notes and, on the delivery the receipt created, the supplier's delivery note, in one transaction
  async update(dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(dto.id, 'Cannot Edit Receipt');
    const note = {
      supplierDeliveryNoteNumber: dto.supplierDeliveryNoteNumber,
      supplierDeliveryNoteDate: dto.supplierDeliveryNoteDate,
    };
    const changesNote = note.supplierDeliveryNoteNumber !== undefined || note.supplierDeliveryNoteDate !== undefined;
    if (changesNote) {
      this.goodsReceiptsRepository.assertOwnsDeliveryNote(receipt);
      await this.deliveriesRepository.assertDeliveryNoteAvailable(
        receipt.supplierId,
        note.supplierDeliveryNoteNumber,
        receipt.inboundDeliveryId,
      );
    }

    this.logger.log(`goodsReceipts.update — ${receipt.grNumber}`);
    await this.database.runInTransaction(async () => {
      if (dto.notes !== undefined) await this.goodsReceiptsService.updateNotes(receipt, dto.notes);
      if (changesNote) await this.deliveriesService.updateNoteFromReceipt(receipt.inboundDeliveryId, note);
    });
    return { success: true, message: `Goods receipt "${receipt.grNumber}" updated successfully.` };
  }

  // Deletes a draft receipt and, when the receipt created its inbound delivery, that delivery too, in one transaction
  async delete(id: string): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(id, 'Cannot Delete');
    const ownsDelivery = receipt.deliverySource === InboundDeliverySourceValues.RECEIPT;
    const purchaseOrderItemIds = ownsDelivery
      ? await this.deliveryLinesRepository.findPurchaseOrderItemIds(receipt.inboundDeliveryId)
      : [];

    return this.database.runInTransaction(async () => {
      const result = await this.goodsReceiptsService.delete(receipt);
      if (ownsDelivery) {
        await this.deliveriesService.deleteFromReceipt(receipt.inboundDeliveryId);
        await this.purchaseOrderItemsRepository.syncExpectedDeliveryDates(purchaseOrderItemIds);
      }
      return result;
    });
  }
}
