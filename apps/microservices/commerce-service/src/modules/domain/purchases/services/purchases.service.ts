import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import { type Purchase, PurchaseStatusValues, purchaseSuppliers, purchases } from '@/db/schema';
import {
  type PurchaseAction,
  PurchaseActionValues,
  PurchaseDto,
  PurchaseStatusLabels,
} from '../dto/entity/purchase.dto';
import { PurchaseTableRowDto } from '../dto/entity/purchase-table-row.dto';
import type { CreatePurchaseDto } from '../dto/request/create-purchase.dto';
import type { UpdatePurchaseDto } from '../dto/request/update-purchase.dto';
import type { PurchaseBlockers, PurchaseState } from '../repositories/purchases.repository';
import { type PurchaseRow, PurchasesDomainRepository } from '../repositories/purchases.repository';

export interface PurchaseLegFacts {
  supplierName: string;
  isSourcing: boolean;
  hasPostedDocument: boolean;
  receivingClosed: boolean;
  blockers: { cancel: string | null; close: string | null };
}

@Injectable()
export class PurchasesDomainService {
  private readonly logger = new Logger(PurchasesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    purchaseNumber: { column: purchases.purchaseNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: purchases.status, type: 'string' },
    siteId: { column: purchases.siteId, type: 'string' },
    supplierId: {
      expression: (value, operator) => {
        const hasLeg = sql`EXISTS (SELECT 1 FROM ${purchaseSuppliers} WHERE ${purchaseSuppliers.purchaseId} = ${purchases.id} AND ${purchaseSuppliers.supplierId} = ${String(value)})`;
        return operator === FilterOperators.NOT_EQUALS ? sql`NOT ${hasLeg}` : hasLeg;
      },
      type: 'string',
    },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...PurchasesDomainService.SEARCH_FIELD_MAP,
    status: { column: purchases.status, type: 'string' },
    createdAt: { column: purchases.createdAt, type: 'string' },
  };
  private static readonly STATUS_LABEL: SQL<string> = sql<string>`CASE ${purchases.status} ${sql.join(
    Object.entries(PurchaseStatusLabels).map(([status, label]) => sql`WHEN ${status} THEN ${label}`),
    sql` `,
  )} END`;

  constructor(private readonly repository: PurchasesDomainRepository) {}

  // Opens a purchase at the given site, else the request's; its items can be quoted and allocated as soon as they are added
  async create(dto: CreatePurchaseDto, siteId?: string): Promise<Purchase> {
    const purchaseNumber = await this.repository.generatePurchaseNumber();
    const purchase = await this.repository.create({
      siteId,
      purchaseNumber,
      quotationsRequired: dto.quotationsRequired,
      minQuotations: dto.minQuotations,
      notes: dto.notes,
    });
    this.logger.log(`Created purchase ${purchaseNumber} at site ${purchase.siteId}`);
    return purchase;
  }

  // Changes an open purchase's header; a null note clears it
  async update(purchase: PurchaseState & Pick<Purchase, 'id'>, dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.repository.assertOpen(purchase, 'Cannot Edit Purchase');
    await this.repository.update(purchase.id, {
      notes: dto.notes,
      quotationsRequired: dto.quotationsRequired,
      minQuotations: dto.minQuotations,
    });
    this.logger.log(`Updated purchase ${purchase.purchaseNumber}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" updated.` };
  }

  // Starts every supplier still in sourcing; stamps when the purchase was first submitted. The caller starts the legs in
  // the same transaction
  async submit(purchase: PurchaseRow, blockers: PurchaseBlockers): Promise<void> {
    if (blockers.submit) throw new ConflictException({ label: 'Cannot Submit Purchase', detail: blockers.submit });
    if (!purchase.submittedAt) await this.repository.update(purchase.id, { submittedAt: new Date() });
    this.logger.log(`Purchase ${purchase.purchaseNumber} submitted its suppliers in sourcing`);
  }

  // Cancels an open purchase whose every open supplier can be cancelled; the caller cancels them in the same transaction
  async cancel(purchase: PurchaseRow, reason: string, blockers: PurchaseBlockers): Promise<void> {
    if (blockers.cancel) throw new ConflictException({ label: 'Cannot Cancel Purchase', detail: blockers.cancel });
    await this.repository.update(purchase.id, {
      status: PurchaseStatusValues.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
    });
    this.logger.log(`Cancelled purchase ${purchase.purchaseNumber}`);
  }

  // Completes an open purchase once nothing is left to allocate and every supplier is closed or cancelled, at least one
  // closed, in the caller's transaction; returns whether it did
  async completeIfDone(
    purchase: PurchaseState & Pick<Purchase, 'id'>,
    facts: { allLegsDone: boolean; hasUnallocated: boolean },
  ): Promise<boolean> {
    if (purchase.status !== PurchaseStatusValues.OPEN || !facts.allLegsDone || facts.hasUnallocated) return false;
    await this.repository.update(purchase.id, { status: PurchaseStatusValues.COMPLETED, completedAt: new Date() });
    this.logger.log(`Completed purchase ${purchase.purchaseNumber}`);
    return true;
  }

  // Returns one purchase
  async findById(id: string): Promise<PurchaseDto> {
    return PurchaseDto.from(await this.repository.findDetailOrThrow(id));
  }

  // Returns one page of purchases with their progress through their step
  async findForTable(state: TableState): Promise<{ result: PurchaseTableRowDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchasesDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, PurchasesDomainService.FILTER_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, PurchasesDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchases.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseTableRowDto.from), count };
  }

  // Returns paginated purchase options, newest first; the `stage` description is the purchase's status
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const describesStage = !query.descriptionKey || query.descriptionKey === 'stage';
    return this.repository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'purchaseNumber',
      description: describesStage ? PurchasesDomainService.STATUS_LABEL : query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      searchKeys: ['purchaseNumber'],
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Explains what keeps each purchase-level action from running, or null when it may: delete while no supplier is
  // added; cancel while every open supplier can be cancelled; close once something is received and no supplier has goods
  // on their way or a draft open; submit while a supplier is still in sourcing
  blockersOf(
    purchase: PurchaseState,
    legs: { count: number; closedCount: number; open: PurchaseLegFacts[] },
  ): PurchaseBlockers {
    if (purchase.status !== PurchaseStatusValues.OPEN) {
      const state = `"${purchase.purchaseNumber}" is ${PurchaseStatusLabels[purchase.status].toLowerCase()}.`;
      return { submit: state, close: state, cancel: state, delete: state };
    }
    const receivedCount = legs.open.filter((leg) => leg.hasPostedDocument).length + legs.closedCount;
    const uncancellable = legs.open.find((leg) => leg.blockers.cancel);
    const unclosable = legs.open.find((leg) => !leg.receivingClosed && leg.blockers.close && leg.blockers.cancel);
    const receivedDetail = `Goods are received from ${pluralize('supplier', receivedCount, true)}; close the purchase instead.`;
    return {
      submit: legs.open.some((leg) => leg.isSourcing)
        ? null
        : 'No supplier is waiting to be submitted; allocate items first.',
      delete: legs.count > 0 ? 'Suppliers are added to it; cancel it instead.' : null,
      cancel:
        receivedCount > 0
          ? receivedDetail
          : uncancellable
            ? `${uncancellable.supplierName}: ${uncancellable.blockers.cancel}`
            : null,
      close:
        receivedCount === 0
          ? 'Nothing is received yet; cancel it instead.'
          : unclosable
            ? `${unclosable.supplierName}: ${unclosable.hasPostedDocument ? unclosable.blockers.close : unclosable.blockers.cancel}`
            : null,
    };
  }

  // Lists the actions an open purchase offers: editing, items and allocations at any time, quotations when it requires
  // them, the rest unless something blocks them
  availableActions(
    purchase: PurchaseState & Pick<Purchase, 'quotationsRequired'>,
    blockers: PurchaseBlockers,
  ): PurchaseAction[] {
    if (purchase.status !== PurchaseStatusValues.OPEN) return [];
    const actions: PurchaseAction[] = [
      PurchaseActionValues.EDIT,
      PurchaseActionValues.EDIT_ITEMS,
      ...(purchase.quotationsRequired ? [PurchaseActionValues.REQUEST_QUOTATION] : []),
      PurchaseActionValues.EDIT_ALLOCATIONS,
    ];
    if (!blockers.submit) actions.push(PurchaseActionValues.SUBMIT);
    if (!blockers.close) actions.push(PurchaseActionValues.CLOSE);
    if (!blockers.cancel) actions.push(PurchaseActionValues.CANCEL);
    if (!blockers.delete) actions.push(PurchaseActionValues.DELETE);
    return actions;
  }

  // Deletes an open purchase no supplier is added to, its items going with it on the foreign key
  async delete(purchase: PurchaseRow, blockers: PurchaseBlockers): Promise<void> {
    if (blockers.delete) throw new ConflictException({ label: 'Cannot Delete Purchase', detail: blockers.delete });
    await this.repository.delete(purchase.id, eq(purchases.status, PurchaseStatusValues.OPEN));
    this.logger.log(`Deleted purchase ${purchase.purchaseNumber}`);
  }
}
