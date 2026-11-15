import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type InboundDelivery,
  type InboundDeliverySource,
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  InboundDeliveryStatusValues,
  inboundDeliveries,
  parties,
} from '@/db/schema';
import { InboundDeliveryDto } from '../dto/entity/inbound-delivery.dto';
import type { CreateInboundDeliveryDto } from '../dto/request/create-inbound-delivery.dto';
import type { UpdateInboundDeliveryDto } from '../dto/request/update-inbound-delivery.dto';
import {
  InboundDeliveriesDomainRepository,
  type InboundDeliveryReceiptProgress,
  type InboundDeliveryRow,
} from '../repositories/inbound-deliveries.repository';

export interface PurchaseDeliveryDraft {
  purchaseId: string;
  supplierId: string;
  siteId: string;
  source: InboundDeliverySource;
  expectedDeliveryDate: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  supplierDeliveryNoteNumber?: string | null;
  supplierDeliveryNoteDate?: string | null;
}

@Injectable()
export class InboundDeliveriesDomainService {
  private readonly logger = new Logger(InboundDeliveriesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    deliveryNumber: { column: inboundDeliveries.deliveryNumber, type: 'string' },
    supplierName: { column: parties.displayName, type: 'string' },
    trackingNumber: { column: inboundDeliveries.trackingNumber, type: 'string' },
    supplierDeliveryNoteNumber: { column: inboundDeliveries.supplierDeliveryNoteNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: inboundDeliveries.status, type: 'string' },
    source: { column: inboundDeliveries.source, type: 'string' },
    supplierId: { column: inboundDeliveries.supplierId, type: 'string' },
    siteId: { column: inboundDeliveries.siteId, type: 'string' },
    sites: { column: inboundDeliveries.siteId, type: 'string' },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...InboundDeliveriesDomainService.SEARCH_FIELD_MAP,
    ...InboundDeliveriesDomainService.FILTER_FIELD_MAP,
    carrier: { column: inboundDeliveries.carrier, type: 'string' },
    expectedDeliveryDate: { column: inboundDeliveries.expectedDeliveryDate, type: 'string' },
    supplierDeliveryNoteDate: { column: inboundDeliveries.supplierDeliveryNoteDate, type: 'string' },
    createdAt: { column: inboundDeliveries.createdAt, type: 'string' },
  };
  private static readonly STATUS_TRANSITIONS: Record<InboundDeliveryStatus, InboundDeliveryStatus[]> = {
    [InboundDeliveryStatusValues.PLANNED]: [
      InboundDeliveryStatusValues.IN_TRANSIT,
      InboundDeliveryStatusValues.ARRIVED,
      InboundDeliveryStatusValues.CANCELLED,
    ],
    [InboundDeliveryStatusValues.IN_TRANSIT]: [
      InboundDeliveryStatusValues.ARRIVED,
      InboundDeliveryStatusValues.CANCELLED,
    ],
    [InboundDeliveryStatusValues.ARRIVED]: [InboundDeliveryStatusValues.CANCELLED],
    [InboundDeliveryStatusValues.PARTIALLY_RECEIVED]: [],
    [InboundDeliveryStatusValues.RECEIVED]: [],
    [InboundDeliveryStatusValues.CANCELLED]: [],
  };

  constructor(private readonly repository: InboundDeliveriesDomainRepository) {}

  // Creates a planned delivery of one supplier at the session site, without lines yet, with the supplier's delivery note when it is known
  async create(dto: CreateInboundDeliveryDto): Promise<CreateResponseDto<InboundDeliveryDto>> {
    this.assertDeliveryNoteDate(
      InboundDeliverySourceValues.ANNOUNCED,
      dto.supplierDeliveryNoteDate,
      dto.expectedDeliveryDate,
    );
    await this.assertDeliveryNoteAvailable(dto.supplierId, dto.supplierDeliveryNoteNumber);
    const deliveryNumber = await this.repository.generateDeliveryNumber();
    const created = await this.repository.create({
      supplierId: dto.supplierId,
      deliveryNumber,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      carrier: dto.carrier ?? null,
      trackingNumber: dto.trackingNumber ?? null,
      supplierDeliveryNoteNumber: dto.supplierDeliveryNoteNumber ?? null,
      supplierDeliveryNoteDate: dto.supplierDeliveryNoteDate ?? null,
      notes: dto.notes ?? null,
    });

    this.logger.log(`Created inbound delivery ${deliveryNumber} for supplier ${dto.supplierId}`);
    return {
      success: true,
      message: `Inbound delivery "${deliveryNumber}" created successfully.`,
      data: await this.findById(created.id),
    };
  }

  // Creates a purchase's delivery of one supplier at the purchase's site, without lines yet, in the caller's transaction;
  // an ANNOUNCED one is planned, one created behind a receipt or invoice has already arrived
  async createForPurchase(draft: PurchaseDeliveryDraft): Promise<InboundDelivery> {
    this.assertDeliveryNoteDate(draft.source, draft.supplierDeliveryNoteDate, draft.expectedDeliveryDate);
    await this.assertDeliveryNoteAvailable(draft.supplierId, draft.supplierDeliveryNoteNumber);
    const deliveryNumber = await this.repository.generateDeliveryNumber();
    const created = await this.repository.create({
      purchaseId: draft.purchaseId,
      supplierId: draft.supplierId,
      siteId: draft.siteId,
      source: draft.source,
      status:
        draft.source === InboundDeliverySourceValues.ANNOUNCED
          ? InboundDeliveryStatusValues.PLANNED
          : InboundDeliveryStatusValues.ARRIVED,
      deliveryNumber,
      expectedDeliveryDate: draft.expectedDeliveryDate,
      carrier: draft.carrier ?? null,
      trackingNumber: draft.trackingNumber ?? null,
      supplierDeliveryNoteNumber: draft.supplierDeliveryNoteNumber ?? null,
      supplierDeliveryNoteDate: draft.supplierDeliveryNoteDate ?? null,
    });
    this.logger.log(`Created ${draft.source} inbound delivery ${deliveryNumber} for purchase ${draft.purchaseId}`);
    return created;
  }

  // Changes the expected date, carrier, tracking number, supplier's delivery note or notes of a delivery that is not yet
  // received or cancelled, keeping the supplier's delivery note unique and not dated after the delivery
  async update(delivery: InboundDeliveryRow, dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    this.assertEditable(delivery, 'Cannot Edit Delivery');
    this.assertDeliveryNoteDate(
      delivery.source,
      dto.supplierDeliveryNoteDate === undefined ? delivery.supplierDeliveryNoteDate : dto.supplierDeliveryNoteDate,
      dto.expectedDeliveryDate ?? delivery.expectedDeliveryDate,
    );
    await this.assertDeliveryNoteAvailable(delivery.supplierId, dto.supplierDeliveryNoteNumber, delivery.id);
    await this.repository.update(delivery.id, {
      expectedDeliveryDate: dto.expectedDeliveryDate,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      supplierDeliveryNoteNumber: dto.supplierDeliveryNoteNumber,
      supplierDeliveryNoteDate: dto.supplierDeliveryNoteDate,
      notes: dto.notes,
    });
    this.logger.log(`Updated inbound delivery ${delivery.deliveryNumber}`);
    return { success: true, message: `Inbound delivery "${delivery.deliveryNumber}" updated successfully.` };
  }

  // Moves a delivery along its manual workflow: in transit, arrived, or cancelled while nothing is received against it
  async setStatus(delivery: InboundDeliveryRow, status: InboundDeliveryStatus): Promise<SuccessResponseDto> {
    this.assertStatusChange(delivery, status);
    await this.repository.update(delivery.id, { status });
    this.logger.log(`Inbound delivery ${delivery.deliveryNumber} status → ${status}`);
    return { success: true, message: `Inbound delivery "${delivery.deliveryNumber}" status updated to ${status}.` };
  }

  // Moves a delivery a posted receipt counts to received once every line is fully accepted against it, else to
  // partially received; a delivery a purchase created behind its receipt is received with that receipt
  async syncReceiptStatus(id: string): Promise<void> {
    const progress = await this.repository.findReceiptProgress(id);
    if (!progress || progress.status === InboundDeliveryStatusValues.CANCELLED) return;
    const nextStatus = this.receiptStatusOf(progress);
    if (nextStatus === progress.status) return;
    await this.repository.update(progress.id, { status: nextStatus });
    this.logger.log(`Inbound delivery ${progress.deliveryNumber} status → ${nextStatus} from its receipts`);
  }

  // Returns one inbound delivery with its supplier, purchase orders, receipts and what may still happen to it
  async findById(id: string): Promise<InboundDeliveryDto> {
    return InboundDeliveryDto.from(await this.findDetailOrThrow(id));
  }

  // Returns one page of inbound deliveries, only those carrying a line of the purchase order when one is given
  async findForTable(
    state: TableState,
    scope: { purchaseOrderId?: string } = {},
  ): Promise<{ result: InboundDeliveryDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InboundDeliveriesDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, InboundDeliveriesDomainService.FILTER_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, InboundDeliveriesDomainService.SEARCH_FIELD_MAP),
        scope.purchaseOrderId ? this.repository.carriesPurchaseOrder(scope.purchaseOrderId) : undefined,
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(inboundDeliveries.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(InboundDeliveryDto.from), count };
  }

  // Loads a delivery with its supplier, lines, purchase orders, receipts and what may still happen to it, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<InboundDeliveryRow> {
    const delivery = await this.repository.findDetail(id);
    if (!delivery) throw new NotFoundException('Inbound delivery not found.');
    return delivery;
  }

  // Returns the deliveries a purchase created, with their receipts and what may still happen to them
  findForPurchase(purchaseId: string): Promise<InboundDeliveryRow[]> {
    return this.repository.findForPurchase(purchaseId);
  }

  // Returns the site's ANNOUNCED inbound deliveries a goods receipt can be created from, by delivery number
  findForSelectReceivable(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectReceivable({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'deliveryNumber',
      description: query.descriptionKey || 'displayName',
      additionalKeys: query.additionalKeys,
      searchKeys: ['deliveryNumber', 'displayName'],
      orderBy: { expectedDeliveryDate: 'asc', deliveryNumber: 'asc' },
    });
  }

  // Rejects a change to a delivery's date, lines or details once it is received or cancelled, or when a purchase created it
  assertEditable(
    delivery: Pick<InboundDeliveryRow, 'deliveryNumber' | 'status' | 'source' | 'isEditable'>,
    label: string,
  ): void {
    if (delivery.isEditable) return;
    const detail =
      delivery.source === InboundDeliverySourceValues.ANNOUNCED
        ? `"${delivery.deliveryNumber}" is ${delivery.status}, so it can no longer change.`
        : `"${delivery.deliveryNumber}" was created by its purchase. Change it on that purchase.`;
    throw new BadRequestException({ label, detail });
  }

  // Rejects receiving a delivery that is received, cancelled, created by a purchase, already has a draft receipt, or has
  // nothing left to receive
  assertReceivable(
    delivery: Pick<
      InboundDeliveryRow,
      'deliveryNumber' | 'status' | 'source' | 'isEditable' | 'draftGoodsReceiptId' | 'canReceive'
    >,
  ): void {
    this.assertEditable(delivery, 'Cannot Receive');
    if (delivery.draftGoodsReceiptId) {
      throw new ConflictException({
        label: 'Draft Receipt Exists',
        detail: `A draft goods receipt for "${delivery.deliveryNumber}" is already open. Post or delete it before receiving again.`,
      });
    }
    if (delivery.canReceive) return;
    throw new BadRequestException({
      label: 'Nothing Left to Receive',
      detail: `Every line of "${delivery.deliveryNumber}" is fully received.`,
    });
  }

  // Deletes a planned delivery that has no lines and no goods receipts
  async delete(delivery: InboundDeliveryRow): Promise<SuccessResponseDto> {
    this.assertDeletable(delivery);
    await this.repository.delete(delivery.id);
    this.logger.log(`Deleted inbound delivery ${delivery.deliveryNumber} (${delivery.id})`);
    return { success: true, message: `Inbound delivery "${delivery.deliveryNumber}" deleted successfully.` };
  }

  // Deletes a delivery a purchase created behind a receipt or invoice once no receipt names it, with its lines, in the
  // caller's transaction
  async deleteForPurchase(delivery: Pick<InboundDeliveryRow, 'id' | 'deliveryNumber' | 'source'>): Promise<void> {
    if (delivery.source === InboundDeliverySourceValues.ANNOUNCED) {
      throw new ConflictException({
        label: 'Cannot Delete',
        detail: `"${delivery.deliveryNumber}" was entered in Inbound Deliveries, so it is cancelled there instead.`,
      });
    }
    await this.repository.delete(delivery.id);
    this.logger.log(`Deleted inbound delivery ${delivery.deliveryNumber} (${delivery.id}) of its purchase`);
  }

  // Derives the status a delivery's posted receipts give it, keeping its status while no receipt is posted
  private receiptStatusOf(progress: InboundDeliveryReceiptProgress): InboundDeliveryStatus {
    if (!progress.hasPostedReceipt) return progress.status;
    if (progress.source !== InboundDeliverySourceValues.ANNOUNCED) return InboundDeliveryStatusValues.RECEIVED;
    if (!progress.hasShortLine) return InboundDeliveryStatusValues.RECEIVED;
    return InboundDeliveryStatusValues.PARTIALLY_RECEIVED;
  }

  // Rejects a supplier delivery note number already on another non-cancelled delivery of the supplier
  private async assertDeliveryNoteAvailable(
    supplierId: string,
    noteNumber: string | null | undefined,
    excludeDeliveryId?: string,
  ): Promise<void> {
    if (!noteNumber) return;
    const takenBy = await this.repository.findDeliveryNumberByNote(supplierId, noteNumber, excludeDeliveryId);
    if (!takenBy) return;
    throw new ConflictException({
      label: 'Delivery Note Already Recorded',
      detail: `The supplier's delivery note "${noteNumber}" is already recorded on inbound delivery "${takenBy}".`,
      errors: [{ field: 'supplierDeliveryNoteNumber', message: 'Already on another delivery' }],
    });
  }

  // Rejects a supplier delivery note dated after the day an inbound delivery is expected
  private assertDeliveryNoteDate(
    source: InboundDeliverySource,
    noteDate: string | null | undefined,
    expectedDeliveryDate: string,
  ): void {
    if (source !== InboundDeliverySourceValues.ANNOUNCED) return;
    if (!noteDate || noteDate <= expectedDeliveryDate) return;
    throw new BadRequestException({
      label: 'Delivery Note Date Too Late',
      detail: `An inbound delivery's note cannot be dated after the day it is expected (${expectedDeliveryDate}).`,
      errors: [{ field: 'supplierDeliveryNoteDate', message: 'After the expected delivery date' }],
    });
  }

  // Rejects a status the user may not move the delivery to: forward from planned through in transit to arrived, or
  // cancelled while nothing is received against it
  private assertStatusChange(
    delivery: Pick<InboundDeliveryRow, 'deliveryNumber' | 'status' | 'source' | 'isEditable' | 'canCancel'>,
    status: InboundDeliveryStatus,
  ): void {
    if (delivery.source !== InboundDeliverySourceValues.ANNOUNCED)
      this.assertEditable(delivery, 'Cannot Change Status');
    const allowedNext = InboundDeliveriesDomainService.STATUS_TRANSITIONS[delivery.status];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException({
        label: 'Cannot Change Status',
        detail: `A ${delivery.status} inbound delivery cannot move to ${status}.`,
        errors: [{ field: 'status', message: `Not allowed from ${delivery.status}` }],
      });
    }
    if (status === InboundDeliveryStatusValues.CANCELLED && !delivery.canCancel) {
      throw new BadRequestException({
        label: 'Cannot Cancel',
        detail: `A goods receipt is recorded against "${delivery.deliveryNumber}". Delete its draft receipts first; a delivery with posted receipts stays.`,
      });
    }
  }

  // Rejects deleting a delivery unless it is planned, has no lines and no goods receipt names it
  private assertDeletable(
    delivery: Pick<InboundDeliveryRow, 'deliveryNumber' | 'status' | 'lineCount' | 'canDelete'>,
  ): void {
    if (delivery.canDelete) return;
    const hasLinesToRemove = delivery.status === InboundDeliveryStatusValues.PLANNED && delivery.lineCount > 0;
    const detail = hasLinesToRemove
      ? `Remove the lines of "${delivery.deliveryNumber}" before deleting it, or cancel it instead.`
      : `Only a planned inbound delivery without lines or goods receipts can be deleted. Cancel "${delivery.deliveryNumber}" instead.`;
    throw new BadRequestException({ label: 'Cannot Delete', detail });
  }
}
