import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { CreateGoodsReceiptFromDeliveryDto } from '@domain/goods-receipts/dto/request/create-goods-receipt-from-delivery.dto';
import type { UpdateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/update-goods-receipt.dto';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
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
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
  ) {}

  // Creates a draft receipt of an inbound delivery that is not received or cancelled and has no draft receipt yet,
  // pre-filled with what is still open on each of its lines
  async createFromDelivery(dto: CreateGoodsReceiptFromDeliveryDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const delivery = await this.deliveriesService.findDetailOrThrow(dto.inboundDeliveryId);
    this.deliveriesService.assertReceivable(delivery);
    await this.supplierEnrollmentsService.assertPurchasable(delivery.supplierId, delivery.siteId);
    const lines = await this.deliveryLinesService.findReceivableOrThrow(delivery);

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

  // Changes a draft receipt's notes; a Receive with Invoice receipt changes only with its supplier invoice
  async update(dto: UpdateGoodsReceiptDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(dto.id, 'Cannot Edit Receipt');
    this.assertNotReceiveWithInvoice(receipt);
    this.logger.log(`goodsReceipts.update — ${receipt.grNumber}`);
    if (dto.notes !== undefined) await this.goodsReceiptsService.updateNotes(receipt, dto.notes);
    return { success: true, message: `Goods receipt "${receipt.grNumber}" updated successfully.` };
  }

  // Deletes a draft receipt that no purchase created
  async delete(id: string): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(id, 'Cannot Delete');
    this.purchasesRepository.assertNotPartOfPurchase(`Goods receipt "${receipt.grNumber}"`, [receipt.purchaseNumber]);
    return this.goodsReceiptsService.delete(receipt);
  }

  // Rejects a change to a Receive with Invoice receipt, which is edited, posted and discarded with its supplier invoice (409)
  private assertNotReceiveWithInvoice(receipt: GoodsReceiptRow): void {
    if (receipt.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesRepository.assertNotPartOfPurchase(`Goods receipt "${receipt.grNumber}"`, [receipt.purchaseNumber]);
  }
}
