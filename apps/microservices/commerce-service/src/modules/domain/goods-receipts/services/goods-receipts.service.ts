import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type SearchState } from '@vritti/api-sdk/conditions';
import {
  CursorCodec,
  type KeysetOrderBy,
  KeysetProcessor,
  keysetSignature,
  type TableState,
} from '@vritti/api-sdk/data-table';
import { and, asc, desc, or } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type GoodsReceipt, GoodsReceiptStatusValues, goodsReceipts, inboundDeliveries, parties } from '@/db/schema';
import { GoodsReceiptDto } from '../dto/entity/goods-receipt.dto';
import {
  type GoodsReceiptDraftLine,
  GoodsReceiptItemsDomainRepository,
} from '../repositories/goods-receipt-items.repository';
import { type GoodsReceiptRow, GoodsReceiptsDomainRepository } from '../repositories/goods-receipts.repository';

export const MIN_SHELF_LIFE_DAYS = 180;

export interface GoodsReceiptDraft {
  purchaseId?: string | null;
  supplierId: string;
  inboundDeliveryId: string;
  siteId: string;
  legalEntityId: string;
  receivedDate: string;
  notes?: string | null;
  lines: GoodsReceiptDraftLine[];
}

export interface GoodsReceiptTableScope {
  purchaseOrderId?: string;
}

export interface GoodsReceiptFeedQuery {
  search?: SearchState | null;
  limit?: number;
  cursor?: string;
}

export interface GoodsReceiptFeed {
  edges: { cursor: string; node: GoodsReceiptDto }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

@Injectable()
export class GoodsReceiptsDomainService {
  private readonly logger = new Logger(GoodsReceiptsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    grNumber: { column: goodsReceipts.grNumber, type: 'string' },
    supplierName: { column: parties.displayName, type: 'string' },
    deliveryNumber: { column: inboundDeliveries.deliveryNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: goodsReceipts.status, type: 'string' },
    supplierId: { column: goodsReceipts.supplierId, type: 'string' },
    siteId: { column: goodsReceipts.siteId, type: 'string' },
    sites: { column: goodsReceipts.siteId, type: 'string' },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...GoodsReceiptsDomainService.SEARCH_FIELD_MAP,
    ...GoodsReceiptsDomainService.FILTER_FIELD_MAP,
    receivedDate: { column: goodsReceipts.receivedDate, type: 'string' },
  };
  private static readonly FEED_ORDER: (KeysetOrderBy & { key: keyof GoodsReceipt })[] = [
    { column: goodsReceipts.createdAt, direction: 'desc', key: 'createdAt' },
    { column: goodsReceipts.id, direction: 'asc', key: 'id' },
  ];

  constructor(
    private readonly repository: GoodsReceiptsDomainRepository,
    private readonly itemsRepository: GoodsReceiptItemsDomainRepository,
  ) {}

  // Returns one page of goods receipts, narrowed to those counting a purchase order's lines when one is named
  async findForTable(
    state: TableState,
    scope: GoodsReceiptTableScope = {},
  ): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, GoodsReceiptsDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, GoodsReceiptsDomainService.FILTER_FIELD_MAP),
        or(
          FilterProcessor.buildSearch(state.search, GoodsReceiptsDomainService.SEARCH_FIELD_MAP),
          this.repository.matchesPurchaseOrderNumber(state.search),
        ),
        scope.purchaseOrderId ? this.repository.countsPurchaseOrder(scope.purchaseOrderId) : undefined,
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(goodsReceipts.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(GoodsReceiptDto.from), count };
  }

  // Returns a keyset page of goods receipts for the mobile infinite feed, newest first
  async findForFeed(query: GoodsReceiptFeedQuery): Promise<GoodsReceiptFeed> {
    const order = GoodsReceiptsDomainService.FEED_ORDER;
    const signature = keysetSignature(order);
    const { rows, hasMore } = await this.repository.findKeysetForFeed({
      where: and(
        or(
          FilterProcessor.buildSearch(query.search, GoodsReceiptsDomainService.SEARCH_FIELD_MAP),
          this.repository.matchesPurchaseOrderNumber(query.search),
        ),
        query.cursor ? KeysetProcessor.buildAfter(order, CursorCodec.decode(query.cursor, signature)) : undefined,
      ),
      orderBy: order.map((entry) => (entry.direction === 'asc' ? asc(entry.column) : desc(entry.column))),
      limit: query.limit ?? 20,
    });

    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(
        order.map((entry) => row[entry.key]),
        signature,
      ),
      node: GoodsReceiptDto.from(row),
    }));
    return { edges, pageInfo: { hasNextPage: hasMore, endCursor: edges.at(-1)?.cursor ?? null } };
  }

  // Returns one goods receipt header with its supplier, delivery, purchase orders and post readiness
  async findById(id: string): Promise<GoodsReceiptDto> {
    return GoodsReceiptDto.from(await this.findDetailOrThrow(id));
  }

  // Returns the receipts a purchase created, with their deliveries and post readiness
  findForPurchase(purchaseId: string): Promise<GoodsReceiptRow[]> {
    return this.repository.findForPurchase(purchaseId);
  }

  // Loads a receipt with its supplier, inbound delivery, purchase orders and post readiness, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<GoodsReceiptRow> {
    const receipt = await this.repository.findDetail(id);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    return receipt;
  }

  // Loads a receipt that is still a draft — the only state whose items, lots and lines may change
  async findDraftOrThrow(id: string, label: string): Promise<GoodsReceiptRow> {
    const receipt = await this.findDetailOrThrow(id);
    if (receipt.status === GoodsReceiptStatusValues.DRAFT) return receipt;
    throw new BadRequestException({
      label,
      detail: `"${receipt.grNumber}" is posted, so it can no longer change.`,
    });
  }

  // Rejects posting a receipt until every item's accepted quantity is fully distributed to balanced lines
  assertPostable(receipt: GoodsReceiptRow): void {
    if (receipt.isPostable) return;
    const detail =
      receipt.itemCount === 0
        ? `Add at least one item to "${receipt.grNumber}" before posting it.`
        : 'Distribute the accepted quantity of every item to lines, and finish their serials, before posting.';
    throw new BadRequestException({ label: 'Not Ready to Post', detail });
  }

  // Creates a draft receipt against an inbound delivery with its lines, in the caller's transaction
  async createDraft(draft: GoodsReceiptDraft): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const grNumber = await this.repository.generateGrNumber();
    const receipt = await this.repository.create({
      grNumber,
      purchaseId: draft.purchaseId ?? null,
      supplierId: draft.supplierId,
      inboundDeliveryId: draft.inboundDeliveryId,
      siteId: draft.siteId,
      legalEntityId: draft.legalEntityId,
      receivedDate: draft.receivedDate,
      notes: draft.notes ?? null,
    });
    await this.itemsRepository.insertMany(
      draft.lines.map((line) => ({ ...line, goodsReceiptId: receipt.id, siteId: draft.siteId })),
    );

    const created = await this.findById(receipt.id);
    this.logger.log(
      `Created goods receipt ${grNumber} with ${draft.lines.length} lines of ${created.poNumbers.join(', ')}`,
    );
    return {
      success: true,
      message: `Goods receipt "${grNumber}" created with ${pluralize('line', draft.lines.length, true)} of ${created.poNumbers.join(', ')}.`,
      data: created,
    };
  }

  // Changes the notes of a draft receipt, in the caller's transaction
  async updateNotes(receipt: GoodsReceiptRow, notes: string | null): Promise<void> {
    await this.repository.update(receipt.id, { notes });
    this.logger.log(`Updated the notes of goods receipt ${receipt.grNumber}`);
  }

  // Marks a draft receipt posted once its stock has landed
  async markPosted(id: string): Promise<void> {
    await this.repository.update(id, { status: GoodsReceiptStatusValues.POSTED, postedAt: new Date() });
    this.logger.log(`Posted goods receipt ${id}`);
  }

  // Deletes a draft goods receipt with everything counted on it
  async delete(receipt: GoodsReceiptRow): Promise<SuccessResponseDto> {
    await this.repository.delete(receipt.id);
    this.logger.log(`Deleted goods receipt ${receipt.grNumber} (${receipt.id})`);
    return { success: true, message: `Goods receipt "${receipt.grNumber}" deleted successfully.` };
  }
}
