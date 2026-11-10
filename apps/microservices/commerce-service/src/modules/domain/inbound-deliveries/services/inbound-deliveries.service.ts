import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type InboundDelivery,
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  inboundDeliveries,
  parties,
} from '@/db/schema';
import { InboundDeliveryDto } from '../dto/entity/inbound-delivery.dto';
import type { CreateInboundDeliveryDto } from '../dto/request/create-inbound-delivery.dto';
import type { UpdateInboundDeliveryDto } from '../dto/request/update-inbound-delivery.dto';
import type { OpenPurchaseOrderLine } from '../repositories/deliverable-purchase-order-items.repository';
import {
  InboundDeliveriesDomainRepository,
  type InboundDeliveryNote,
  type InboundDeliveryRow,
  type ReceiptDeliveryDraft,
} from '../repositories/inbound-deliveries.repository';
import { InboundDeliveryLinesDomainRepository } from '../repositories/inbound-delivery-lines.repository';

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

  constructor(
    private readonly repository: InboundDeliveriesDomainRepository,
    private readonly linesRepository: InboundDeliveryLinesDomainRepository,
  ) {}

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

  // Returns one inbound delivery with its supplier, purchase orders, receipts and what may still happen to it
  async findById(id: string): Promise<InboundDeliveryDto> {
    return InboundDeliveryDto.from(await this.repository.findDetailOrThrow(id));
  }

  // Creates a planned delivery of one supplier at the session site, without lines yet, with the supplier's delivery note when it is known
  async create(dto: CreateInboundDeliveryDto): Promise<CreateResponseDto<InboundDeliveryDto>> {
    this.repository.assertDeliveryNoteDate(
      InboundDeliverySourceValues.ANNOUNCED,
      dto.supplierDeliveryNoteDate,
      dto.expectedDeliveryDate,
    );
    await this.repository.assertDeliveryNoteAvailable(dto.supplierId, dto.supplierDeliveryNoteNumber);
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

  // Returns the site's announced deliveries a goods receipt can be created from, by delivery number
  findForSelectReceivable(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectReceivable({
      value: query.valueKey || 'id',
      label: query.labelKey || 'deliveryNumber',
      description: query.descriptionKey || 'displayName',
      additionalKeys: query.additionalKeys,
      search: query.search,
      searchKeys: ['deliveryNumber', 'displayName'],
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderBy: { expectedDeliveryDate: 'asc', deliveryNumber: 'asc' },
    });
  }

  // Creates the arrived delivery a goods receipt without an announced delivery stands on, carrying the receipt's lines
  async createFromReceipt(
    draft: ReceiptDeliveryDraft,
    receivedDate: string,
    timezone: string,
    lines: OpenPurchaseOrderLine[],
  ): Promise<InboundDelivery> {
    const delivery = await this.repository.createFromReceipt(draft, receivedDate, timezone);
    await this.linesRepository.insertMany(
      lines.map((line) => ({
        inboundDeliveryId: delivery.id,
        purchaseOrderItemId: line.purchaseOrderItemId,
        quantity: line.quantity,
      })),
    );
    this.logger.log(
      `Created inbound delivery ${delivery.deliveryNumber} from a goods receipt with ${lines.length} lines`,
    );
    return delivery;
  }

  // Changes the expected date, carrier, tracking number, supplier's delivery note or notes of a delivery that is not yet received or cancelled
  async update(delivery: InboundDeliveryRow, dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    this.repository.assertEditable(delivery, 'Cannot Edit Delivery');
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

  // Changes the supplier's delivery note on the delivery a draft goods receipt created, in the caller's transaction
  async updateNoteFromReceipt(id: string, note: Partial<InboundDeliveryNote>): Promise<void> {
    await this.repository.update(id, note);
    this.logger.log(`Updated the supplier's delivery note of inbound delivery ${id} from its goods receipt`);
  }

  // Moves a delivery along its manual workflow: in transit, arrived, or cancelled while nothing is received against it
  async setStatus(delivery: InboundDeliveryRow, status: InboundDeliveryStatus): Promise<SuccessResponseDto> {
    this.repository.assertStatusChange(delivery, status);
    await this.repository.update(delivery.id, { status });
    this.logger.log(`Inbound delivery ${delivery.deliveryNumber} status → ${status}`);
    return { success: true, message: `Inbound delivery "${delivery.deliveryNumber}" status updated to ${status}.` };
  }

  // Moves a delivery to received or partially received from what its published goods receipts accepted
  async syncReceiptStatus(id: string): Promise<void> {
    const moved = await this.repository.syncReceiptStatus(id);
    if (moved) this.logger.log(`Inbound delivery ${moved.deliveryNumber} status → ${moved.status} from its receipts`);
  }

  // Deletes the delivery a draft goods receipt created, with its lines, once the receipt is gone
  async deleteFromReceipt(id: string): Promise<void> {
    await this.repository.delete(id);
    this.logger.log(`Deleted inbound delivery ${id} with its goods receipt`);
  }

  // Deletes a planned delivery that has no lines and no goods receipts
  async delete(id: string): Promise<SuccessResponseDto> {
    const delivery = await this.repository.findDetailOrThrow(id);
    this.repository.assertDeletable(delivery);
    await this.repository.delete(delivery.id);
    this.logger.log(`Deleted inbound delivery ${delivery.deliveryNumber} (${delivery.id})`);
    return { success: true, message: `Inbound delivery "${delivery.deliveryNumber}" deleted successfully.` };
  }
}
