import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseOrderItemRow } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderRow } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import {
  PurchaseLegActionValues,
  PurchaseLegStepLabels,
} from '@domain/purchase-suppliers/dto/entity/purchase-supplier.dto';
import type { CloseSupplierDto } from '@domain/purchase-suppliers/dto/request/close-supplier.dto';
import type { ConfirmLegPurchaseOrderDto } from '@domain/purchase-suppliers/dto/request/confirm-leg-purchase-order.dto';
import type { CreateLegGoodsReceiptDto } from '@domain/purchase-suppliers/dto/request/create-leg-goods-receipt.dto';
import type { CreateLegInboundDeliveryDto } from '@domain/purchase-suppliers/dto/request/create-leg-inbound-delivery.dto';
import type { CreateLegPurchaseOrderDto } from '@domain/purchase-suppliers/dto/request/create-leg-purchase-order.dto';
import type { RejectPurchaseLegDto } from '@domain/purchase-suppliers/dto/request/reject-purchase-leg.dto';
import type { PurchaseSupplierRow } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import {
  type LegApprovers,
  PurchaseSuppliersDomainService,
} from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  InboundDeliverySourceValues,
  type PurchaseLegStep,
  PurchaseOrderStatusValues,
  PurchaseTypeValues,
} from '@/db/schema';
import {
  type PurchaseLegFulfilment,
  PurchaseProgressService,
} from '@/modules/site/purchase-progress/services/purchase-progress.service';
import { PurchaseLegDocumentsService, type PurchaseSiteContext } from './purchase-leg-documents.service';

export interface PurchaseLegRef {
  id: string;
  legId: string;
}

interface LoadedLeg {
  purchase: PurchaseRow;
  leg: PurchaseSupplierRow;
  fulfilment: PurchaseLegFulfilment;
}

@Injectable()
export class PurchasesLegsService {
  private readonly logger = new Logger(PurchasesLegsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesService: PurchasesDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly progressService: PurchaseProgressService,
    private readonly documentsService: PurchaseLegDocumentsService,
  ) {}

  // Creates a leg's purchase orders: one sent PO per currency of its allocations, each allocation becoming a line of it
  async createPurchaseOrder(
    dto: CreateLegPurchaseOrderDto,
    site: PurchaseSiteContext,
  ): Promise<CreateResponseDto<{ purchaseOrderIds: string[] }>> {
    const { purchase, leg, fulfilment } = await this.loadLeg(dto);
    this.legsService.assertActionAvailable(
      leg,
      purchase,
      fulfilment.facts,
      PurchaseLegActionValues.CREATE_PURCHASE_ORDER,
    );
    const allocations = await this.allocationsService.findWithLegs({ purchaseSupplierId: leg.id });
    const terms = {
      orderDate: dto.orderDate,
      status: PurchaseOrderStatusValues.SENT,
      exchangeRates: new Map((dto.exchangeRates ?? []).map((rate) => [rate.currencyCode, rate.rate])),
      expectedDeliveryDate: dto.expectedDeliveryDate,
    };
    const plan = await this.documentsService.planOrders(purchase, leg, allocations, terms, site);

    const orders = await this.database.runInTransaction(async () => {
      const created = await this.documentsService.createOrders(purchase, leg, plan, terms);
      await this.progressService.syncLegStep(purchase, leg);
      return created;
    });
    this.logger.log(
      `purchases.legs.createPurchaseOrder — ${purchase.purchaseNumber}, leg: ${leg.id}, POs: ${orders.length}`,
    );
    return {
      success: true,
      message: `${pluralize('purchase order', orders.length, true)} sent to ${leg.supplierName} for "${purchase.purchaseNumber}": ${orders.map((po) => po.poNumber).join(', ')}.`,
      data: { purchaseOrderIds: orders.map((po) => po.id) },
    };
  }

  // Creates an inbound delivery of a leg's confirmed PO lines, each within what it still has open to deliver
  async createInboundDelivery(
    dto: CreateLegInboundDeliveryDto,
  ): Promise<CreateResponseDto<{ inboundDeliveryId: string }>> {
    const { purchase, leg, fulfilment } = await this.loadLeg(dto);
    this.legsService.assertActionAvailable(
      leg,
      purchase,
      fulfilment.facts,
      PurchaseLegActionValues.CREATE_INBOUND_DELIVERY,
    );
    this.assertConfirmedLinesOfLeg(
      fulfilment,
      dto.lines.map((line) => line.purchaseOrderItemId),
    );

    const delivery = await this.database.runInTransaction(async () => {
      const created = await this.deliveriesService.createForPurchase({
        purchaseId: purchase.id,
        supplierId: leg.supplierId,
        siteId: purchase.siteId,
        source: InboundDeliverySourceValues.ANNOUNCED,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        supplierDeliveryNoteNumber: dto.supplierDeliveryNoteNumber,
        supplierDeliveryNoteDate: dto.supplierDeliveryNoteDate,
      });
      const row = await this.deliveriesService.findDetailOrThrow(created.id);
      const items = await this.deliveryLinesService.findDeliverableOrThrow(
        row,
        dto.lines.map((line) => line.purchaseOrderItemId),
      );
      await this.deliveryLinesService.addLines(row, { inboundDeliveryId: row.id, lines: dto.lines }, items);
      await this.progressService.syncLegStep(purchase, leg);
      return row;
    });
    this.logger.log(
      `purchases.legs.createInboundDelivery — ${purchase.purchaseNumber}, delivery: ${delivery.deliveryNumber}`,
    );
    return {
      success: true,
      message: `Inbound delivery "${delivery.deliveryNumber}" created for "${purchase.purchaseNumber}".`,
      data: { inboundDeliveryId: delivery.id },
    };
  }

  // Starts a draft receipt of a leg: from one of its deliveries, or from its open confirmed lines through a delivery
  // created behind it; a direct receipt orders its allocations first
  async createGoodsReceipt(
    dto: CreateLegGoodsReceiptDto,
    site: PurchaseSiteContext,
  ): Promise<CreateResponseDto<{ goodsReceiptId: string }>> {
    const { purchase, leg, fulfilment } = await this.loadLeg(dto);
    this.legsService.assertActionAvailable(
      leg,
      purchase,
      fulfilment.facts,
      PurchaseLegActionValues.CREATE_GOODS_RECEIPT,
    );
    const receipt = dto.inboundDeliveryId
      ? await this.receiveInboundDelivery(purchase, leg, dto, dto.inboundDeliveryId)
      : await this.receiveWithoutDelivery(purchase, leg, fulfilment, dto, site);
    this.logger.log(
      `purchases.legs.createGoodsReceipt — ${purchase.purchaseNumber}, receipt: ${receipt.data.grNumber}`,
    );
    return {
      success: true,
      message: `Goods receipt "${receipt.data.grNumber}" drafted for "${purchase.purchaseNumber}".`,
      data: { goodsReceiptId: receipt.data.id },
    };
  }

  // Starts a leg in sourcing against its supplier's current enrollment and sourced total, stamping the caller as its
  // submitter, in the caller's transaction; returns the step it reached
  async startLeg(
    purchase: PurchaseRow,
    leg: PurchaseSupplierRow,
    headers: NatsHeaders,
    leCurrencyCode: string,
  ): Promise<PurchaseLegStep> {
    const snapshot = await this.supplierEnrollmentsService.findPurchasingSnapshot(leg.supplierId, purchase.siteId);
    const allocations = await this.allocationsService.findByLegId(leg.id);
    return this.legsService.start(leg, {
      snapshot,
      sourcing: this.allocationsService.summarize(allocations),
      leCurrencyCode,
      submittedBy: headers.userId || null,
    });
  }

  // Starts one leg of a submitted purchase on its own: one rejected back to sourcing or opened after the submit
  async submitSupplier(ref: PurchaseLegRef, headers: NatsHeaders, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(ref.id);
    this.legsService.assertStartableAlone(purchase);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, ref.legId);
    const step = await this.database.runInTransaction(() => this.startLeg(purchase, leg, headers, leCurrencyCode));
    this.logger.log(`purchases.legs.submitSupplier — ${purchase.purchaseNumber}, leg: ${leg.id} → ${step}`);
    return {
      success: true,
      message: `${leg.supplierName} on "${purchase.purchaseNumber}" submitted; it is now in ${PurchaseLegStepLabels[step]}.`,
    };
  }

  // Approves a leg waiting for approval as one of its enrollment's current approvers who did not submit it
  async approve(ref: PurchaseLegRef, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(ref.id);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, ref.legId);
    const approvers = await this.findApprovers(leg, headers);
    const step = await this.legsService.approve(leg, approvers);
    this.logger.log(`purchases.legs.approve — ${purchase.purchaseNumber}, leg: ${leg.id} → ${step}`);
    return {
      success: true,
      message: `${leg.supplierName} on "${purchase.purchaseNumber}" approved; it is now in ${PurchaseLegStepLabels[step]}.`,
    };
  }

  // Rejects a leg waiting for approval back to sourcing with a reason; the purchase's other legs carry on
  async reject(dto: RejectPurchaseLegDto, headers: NatsHeaders): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, dto.legId);
    const approvers = await this.findApprovers(leg, headers);
    await this.legsService.reject(leg, approvers, dto.reason);
    this.logger.log(`purchases.legs.reject — ${purchase.purchaseNumber}, leg: ${leg.id}`);
    return {
      success: true,
      message: `${leg.supplierName} on "${purchase.purchaseNumber}" sent back to sourcing.`,
    };
  }

  // Confirms a sent PO of a leg through the PO's own rule and re-derives the leg's step
  async confirmPurchaseOrder(dto: ConfirmLegPurchaseOrderDto): Promise<SuccessResponseDto> {
    const { purchase, leg, fulfilment } = await this.loadLeg(dto);
    const po = await this.findLegOrderOrThrow(purchase, leg, dto.purchaseOrderId);
    this.legsService.assertActionAvailable(
      leg,
      purchase,
      fulfilment.facts,
      PurchaseLegActionValues.CONFIRM_PURCHASE_ORDER,
    );
    await this.database.runInTransaction(async () => {
      await this.purchaseOrdersService.changeStatus(po, PurchaseOrderStatusValues.CONFIRMED);
      await this.progressService.syncLegStep(purchase, leg);
    });
    this.logger.log(`purchases.legs.confirmPurchaseOrder — ${purchase.purchaseNumber}, PO: ${po.poNumber}`);
    return { success: true, message: `Purchase order "${po.poNumber}" confirmed.` };
  }

  // Closes a leg: its confirmed POs complete delivery and its sent ones are cancelled; the purchase completes with its last leg
  async closeSupplier(dto: CloseSupplierDto): Promise<SuccessResponseDto> {
    const { purchase, leg, fulfilment } = await this.loadLeg(dto);
    this.legsService.assertActionAvailable(leg, purchase, fulfilment.facts, PurchaseLegActionValues.CLOSE_SUPPLIER);
    const openOrders = fulfilment.documents.purchaseOrders.filter(
      (po) => po.status === PurchaseOrderStatusValues.CONFIRMED || po.status === PurchaseOrderStatusValues.SENT,
    );
    await this.database.runInTransaction(async () => {
      for (const po of openOrders) await this.completeOrCancelOrder(po);
      await this.legsService.close(leg, purchase, fulfilment.facts, dto.reason ?? null);
      await this.progressService.completeIfLegsClosed(purchase);
    });
    this.logger.log(
      `purchases.legs.closeSupplier — ${purchase.purchaseNumber}, leg: ${leg.id}, POs: ${openOrders.length}`,
    );
    return { success: true, message: `${leg.supplierName} on "${purchase.purchaseNumber}" closed.` };
  }

  // Loads a purchase, one of its legs and the leg's documents and fulfilment facts
  private async loadLeg(ref: PurchaseLegRef): Promise<LoadedLeg> {
    const purchase = await this.purchasesService.findDetailOrThrow(ref.id);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, ref.legId);
    const fulfilment = await this.progressService.findLegFulfilment(purchase, leg);
    return { purchase, leg, fulfilment };
  }

  // Drafts a receipt of one of the leg's deliveries that is not received or cancelled and has no draft receipt
  private async receiveInboundDelivery(
    purchase: PurchaseRow,
    leg: PurchaseSupplierRow,
    dto: CreateLegGoodsReceiptDto,
    inboundDeliveryId: string,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const delivery = await this.deliveriesService.findDetailOrThrow(inboundDeliveryId);
    if (delivery.purchaseId !== purchase.id || delivery.supplierId !== leg.supplierId) {
      throw new BadRequestException({
        label: "Not This Supplier's Delivery",
        detail: `"${delivery.deliveryNumber}" is not a delivery of ${leg.supplierName} on "${purchase.purchaseNumber}".`,
        errors: [{ field: 'inboundDeliveryId', message: 'Not a delivery of this supplier' }],
      });
    }
    this.deliveriesService.assertReceivable(delivery);
    await this.supplierEnrollmentsService.assertPurchasable(leg.supplierId, purchase.siteId);
    return this.database.runInTransaction(async () => {
      const receipt = await this.documentsService.receiveDelivery(purchase, delivery.id, dto.receivedDate);
      await this.progressService.syncLegStep(purchase, leg);
      return receipt;
    });
  }

  // Drafts a receipt of the leg's open confirmed lines through a delivery created behind it; a direct receipt without a
  // PO orders its allocations first, confirmed and dated the day received
  private async receiveWithoutDelivery(
    purchase: PurchaseRow,
    leg: PurchaseSupplierRow,
    fulfilment: PurchaseLegFulfilment,
    dto: CreateLegGoodsReceiptDto,
    site: PurchaseSiteContext,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    if (leg.type === PurchaseTypeValues.ANNOUNCED) {
      throw new BadRequestException({
        label: 'Delivery Required',
        detail: `${leg.supplierName} sends inbound deliveries; receive one of its inbound deliveries on this purchase.`,
        errors: [{ field: 'inboundDeliveryId', message: 'Pick an inbound delivery' }],
      });
    }
    await this.supplierEnrollmentsService.assertPurchasable(leg.supplierId, purchase.siteId);
    const mustOrder =
      leg.type === PurchaseTypeValues.DIRECT_RECEIPT && fulfilment.facts.purchaseOrderStatuses.length === 0;
    const terms = {
      orderDate: this.documentsService.dateOf(dto.receivedDate),
      status: PurchaseOrderStatusValues.CONFIRMED,
      exchangeRates: new Map<string, number>(),
    };
    const plan = mustOrder
      ? await this.documentsService.planOrders(
          purchase,
          leg,
          await this.allocationsService.findWithLegs({ purchaseSupplierId: leg.id }),
          terms,
          site,
        )
      : null;

    return this.database.runInTransaction(async () => {
      if (plan) {
        await this.documentsService.createOrders(purchase, leg, plan, terms);
        await this.progressService.syncLegStep(purchase, leg);
      }
      const current = plan ? await this.progressService.findLegFulfilment(purchase, leg) : fulfilment;
      const receipt = await this.documentsService.receiveOpenLines(
        purchase,
        leg,
        this.confirmedLines(current),
        current.remainingByLine,
        dto,
      );
      await this.progressService.syncLegStep(purchase, leg);
      return receipt;
    });
  }

  // Completes delivery of a confirmed PO, cancelling what its lines still had to receive, or cancels one only sent, in
  // the caller's transaction
  private async completeOrCancelOrder(po: PurchaseOrderRow): Promise<void> {
    if (po.status === PurchaseOrderStatusValues.SENT) {
      await this.purchaseOrdersService.changeStatus(po, PurchaseOrderStatusValues.CANCELLED);
      return;
    }
    await this.purchaseOrdersService.completeDelivery(po);
    await this.purchaseOrderItemsService.cancelRemaining(po.id);
    await this.purchaseOrdersService.syncProgress([po.id]);
  }

  // Loads a PO of the leg, throwing when it is not one of the leg's
  private async findLegOrderOrThrow(
    purchase: PurchaseRow,
    leg: PurchaseSupplierRow,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderRow> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(purchaseOrderId);
    if (po.purchaseId === purchase.id && po.supplierId === leg.supplierId) return po;
    throw new NotFoundException('Purchase order not found for this supplier.');
  }

  // Returns the lines of the leg's confirmed POs
  private confirmedLines(fulfilment: PurchaseLegFulfilment): PurchaseOrderItemRow[] {
    const confirmedIds = new Set(
      fulfilment.documents.purchaseOrders
        .filter((po) => po.status === PurchaseOrderStatusValues.CONFIRMED)
        .map((po) => po.id),
    );
    return fulfilment.orderLines.filter((line) => confirmedIds.has(line.purchaseOrderId));
  }

  // Rejects an inbound delivery of a line that is not on one of the leg's confirmed POs
  private assertConfirmedLinesOfLeg(fulfilment: PurchaseLegFulfilment, purchaseOrderItemIds: string[]): void {
    const confirmed = new Set(this.confirmedLines(fulfilment).map((line) => line.id));
    if (purchaseOrderItemIds.every((id) => confirmed.has(id))) return;
    throw new BadRequestException({
      label: 'Not a Line of This Supplier',
      detail: "Create inbound deliveries only for lines of the supplier's confirmed purchase orders.",
      errors: [{ field: 'lines', message: 'Not a confirmed line of this supplier' }],
    });
  }

  // Gathers the caller, the leg's enrollment's current approvers and the user who last submitted the leg
  private async findApprovers(leg: PurchaseSupplierRow, headers: NatsHeaders): Promise<LegApprovers> {
    const approversByEnrollment = await this.supplierEnrollmentsService.findApproverUserIds([leg.supplierEnrollmentId]);
    return {
      userId: headers.userId || null,
      approverUserIds: approversByEnrollment.get(leg.supplierEnrollmentId) ?? [],
      submitterId: leg.submittedBy,
    };
  }
}
