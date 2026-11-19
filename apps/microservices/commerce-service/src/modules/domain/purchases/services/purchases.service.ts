import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type Purchase,
  PurchaseQuotationChangeTypeValues,
  PurchaseStatusValues,
  purchaseSuppliers,
  purchases,
} from '@/db/schema';
import {
  type PurchaseAction,
  PurchaseActionValues,
  PurchaseDto,
  PurchaseStatusLabels,
} from '../dto/entity/purchase.dto';
import { PurchaseTableRowDto } from '../dto/entity/purchase-table-row.dto';
import type { ChangePurchaseMinQuotationsDto } from '../dto/request/change-purchase-min-quotations.dto';
import type { CreatePurchaseDto } from '../dto/request/create-purchase.dto';
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

  // Changes an open purchase's notes; a null note clears them
  async changeNotes(purchase: PurchaseRow, notes: string | null): Promise<SuccessResponseDto> {
    this.repository.assertOpen(purchase, 'Cannot Change Notes');
    await this.repository.update(purchase.id, { notes });
    this.logger.log(`Changed the notes of purchase ${purchase.purchaseNumber}`);
    return { success: true, message: `Notes of "${purchase.purchaseNumber}" changed.` };
  }

  // Starts requiring quotations, at the given minimum per item, on an open purchase none of whose suppliers is submitted
  // yet, recording who did it
  async enableQuotations(
    purchase: PurchaseRow,
    minQuotations: number,
    blockers: PurchaseBlockers,
    userId: string | null,
  ): Promise<SuccessResponseDto> {
    if (blockers.enableQuotations) {
      throw new ConflictException({ label: 'Cannot Enable Quotations', detail: blockers.enableQuotations });
    }
    await this.repository.transaction(async () => {
      await this.repository.update(purchase.id, { quotationsRequired: true, minQuotations });
      await this.repository.recordQuotationChange({
        purchaseId: purchase.id,
        type: PurchaseQuotationChangeTypeValues.ENABLED,
        toMinQuotations: minQuotations,
        changedBy: userId,
      });
    });
    this.logger.log(`Purchase ${purchase.purchaseNumber} requires ${minQuotations} quotations per item`);
    return {
      success: true,
      message: `"${purchase.purchaseNumber}" now requires ${pluralize('posted quotation', minQuotations, true)} per item.`,
    };
  }

  // Stops requiring quotations on an open purchase, recording who did it and why
  async disableQuotations(purchase: PurchaseRow, reason: string, userId: string | null): Promise<SuccessResponseDto> {
    this.assertQuotationsRequired(purchase, 'Cannot Disable Quotations');
    await this.repository.transaction(async () => {
      await this.repository.update(purchase.id, { quotationsRequired: false });
      await this.repository.recordQuotationChange({
        purchaseId: purchase.id,
        type: PurchaseQuotationChangeTypeValues.DISABLED,
        fromMinQuotations: purchase.minQuotations,
        reason,
        changedBy: userId,
      });
    });
    this.logger.log(`Purchase ${purchase.purchaseNumber} no longer requires quotations`);
    return { success: true, message: `"${purchase.purchaseNumber}" no longer requires quotations.` };
  }

  // Changes how many posted quotations each item of an open purchase needs before its supplier is submitted, recording
  // who did it; lowering it needs a reason
  async changeMinQuotations(
    purchase: PurchaseRow,
    dto: ChangePurchaseMinQuotationsDto,
    userId: string | null,
  ): Promise<SuccessResponseDto> {
    this.assertQuotationsRequired(purchase, 'Cannot Change Minimum');
    if (dto.minQuotations === purchase.minQuotations) {
      throw new BadRequestException({
        label: 'Minimum Unchanged',
        detail: `"${purchase.purchaseNumber}" already requires ${pluralize('quotation', dto.minQuotations, true)} per item.`,
        errors: [{ field: 'minQuotations', message: 'Same as the current minimum' }],
      });
    }
    if (dto.minQuotations < purchase.minQuotations && !dto.reason) {
      throw new BadRequestException({
        label: 'Reason Required',
        detail: 'Say why fewer quotations are enough; lowering the minimum is recorded.',
        errors: [{ field: 'reason', message: 'Reason is required to lower the minimum' }],
      });
    }
    await this.repository.transaction(async () => {
      await this.repository.update(purchase.id, { minQuotations: dto.minQuotations });
      await this.repository.recordQuotationChange({
        purchaseId: purchase.id,
        type: PurchaseQuotationChangeTypeValues.MINIMUM_CHANGED,
        fromMinQuotations: purchase.minQuotations,
        toMinQuotations: dto.minQuotations,
        reason: dto.reason ?? null,
        changedBy: userId,
      });
    });
    this.logger.log(
      `Purchase ${purchase.purchaseNumber} minimum quotations ${purchase.minQuotations} → ${dto.minQuotations}`,
    );
    return {
      success: true,
      message: `"${purchase.purchaseNumber}" now requires ${pluralize('posted quotation', dto.minQuotations, true)} per item.`,
    };
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
  // on their way or a draft open; submit while a supplier is still in sourcing; requiring quotations before any supplier
  // is submitted
  blockersOf(
    purchase: PurchaseState & Pick<Purchase, 'quotationsRequired'>,
    legs: { count: number; closedCount: number; submittedCount: number; open: PurchaseLegFacts[] },
  ): PurchaseBlockers {
    if (purchase.status !== PurchaseStatusValues.OPEN) {
      const state = `"${purchase.purchaseNumber}" is ${PurchaseStatusLabels[purchase.status].toLowerCase()}.`;
      return { enableQuotations: state, submit: state, close: state, cancel: state, delete: state };
    }
    const receivedCount = legs.open.filter((leg) => leg.hasPostedDocument).length + legs.closedCount;
    const uncancellable = legs.open.find((leg) => leg.blockers.cancel);
    const unclosable = legs.open.find((leg) => !leg.receivingClosed && leg.blockers.close && leg.blockers.cancel);
    const receivedDetail = `Goods are received from ${pluralize('supplier', receivedCount, true)}; close the purchase instead.`;
    return {
      enableQuotations: purchase.quotationsRequired
        ? 'Quotations are already required.'
        : legs.submittedCount > 0
          ? `${pluralize('supplier', legs.submittedCount, true)} already submitted without quotations; quotations can only be required before the first is submitted.`
          : null,
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

  // Lists the actions an open purchase offers: notes, items and allocations at any time; requesting quotations, changing
  // their minimum and dropping them while it requires them; the rest unless something blocks them
  availableActions(
    purchase: PurchaseState & Pick<Purchase, 'quotationsRequired'>,
    blockers: PurchaseBlockers,
  ): PurchaseAction[] {
    if (purchase.status !== PurchaseStatusValues.OPEN) return [];
    const actions: PurchaseAction[] = [
      PurchaseActionValues.CHANGE_NOTES,
      PurchaseActionValues.EDIT_ITEMS,
      ...(purchase.quotationsRequired
        ? [
            PurchaseActionValues.REQUEST_QUOTATION,
            PurchaseActionValues.CHANGE_MIN_QUOTATIONS,
            PurchaseActionValues.DISABLE_QUOTATIONS,
          ]
        : []),
      PurchaseActionValues.EDIT_ALLOCATIONS,
    ];
    if (!blockers.enableQuotations) actions.push(PurchaseActionValues.ENABLE_QUOTATIONS);
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

  // Rejects changing the quotation requirement of a purchase that is not open or does not require quotations (409)
  private assertQuotationsRequired(purchase: PurchaseRow, label: string): void {
    this.repository.assertOpen(purchase, label);
    if (purchase.quotationsRequired) return;
    throw new ConflictException({ label, detail: `"${purchase.purchaseNumber}" does not require quotations.` });
  }
}
