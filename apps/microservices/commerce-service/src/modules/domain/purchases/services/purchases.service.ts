import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, desc, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
import {
  type Purchase,
  PurchaseStatusValues,
  type PurchaseStep,
  PurchaseStepValues,
  purchaseSuppliers,
  purchases,
} from '@/db/schema';
import {
  type PurchaseAction,
  PurchaseActionValues,
  PurchaseDto,
  PurchaseStatusLabels,
  PurchaseStepLabels,
} from '../dto/entity/purchase.dto';
import { PurchaseTableRowDto } from '../dto/entity/purchase-table-row.dto';
import type { CreatePurchaseDto } from '../dto/request/create-purchase.dto';
import type { UpdatePurchaseDto } from '../dto/request/update-purchase.dto';
import {
  type PurchaseHeaderRow,
  type PurchaseRow,
  PurchasesDomainRepository,
} from '../repositories/purchases.repository';

export interface PurchaseActionFacts {
  postedSupplierCount: number;
  hasSourcingLeg: boolean;
}

type PurchaseState = Pick<Purchase, 'purchaseNumber' | 'status' | 'step'>;

@Injectable()
export class PurchasesDomainService {
  private readonly logger = new Logger(PurchasesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    purchaseNumber: { column: purchases.purchaseNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: purchases.status, type: 'string' },
    step: { column: purchases.step, type: 'string' },
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
    step: { column: purchases.step, type: 'string' },
    createdAt: { column: purchases.createdAt, type: 'string' },
  };
  private static readonly STAGE_LABEL: SQL<string> =
    sql<string>`CASE WHEN ${purchases.status} = ${PurchaseStatusValues.OPEN}
    THEN CASE ${purchases.step} ${sql.join(
      Object.entries(PurchaseStepLabels).map(([step, label]) => sql`WHEN ${step} THEN ${label}`),
      sql` `,
    )} END
    ELSE CASE ${purchases.status} ${sql.join(
      Object.entries(PurchaseStatusLabels).map(([status, label]) => sql`WHEN ${status} THEN ${label}`),
      sql` `,
    )} END END`;

  constructor(private readonly repository: PurchasesDomainRepository) {}

  // Opens a purchase in REQUESTING at the given site, else the request's; the caller adds its items in the same transaction
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

  // Changes a purchase's header while it is in REQUESTING; a null needed-by date or note clears it
  async update(purchase: PurchaseState & Pick<Purchase, 'id'>, dto: UpdatePurchaseDto): Promise<SuccessResponseDto> {
    this.assertInStep(purchase, [PurchaseStepValues.REQUESTING], 'Cannot Edit Purchase');
    await this.repository.update(purchase.id, {
      notes: dto.notes,
      quotationsRequired: dto.quotationsRequired,
      minQuotations: dto.minQuotations,
    });
    this.logger.log(`Updated purchase ${purchase.purchaseNumber}`);
    return { success: true, message: `Purchase "${purchase.purchaseNumber}" updated.` };
  }

  // Submits the items of a purchase that has some, moving it to QUOTING when quotations are required and to SOURCING otherwise
  async submitItems(purchase: PurchaseRow): Promise<PurchaseStep> {
    this.assertInStep(purchase, [PurchaseStepValues.REQUESTING], 'Cannot Submit Items');
    if (purchase.itemCount === 0) {
      throw new BadRequestException({
        label: 'No Items',
        detail: `Add the items to buy to "${purchase.purchaseNumber}" before submitting its items.`,
      });
    }
    const step = purchase.quotationsRequired ? PurchaseStepValues.QUOTING : PurchaseStepValues.SOURCING;
    await this.repository.update(purchase.id, { step });
    this.logger.log(`Purchase ${purchase.purchaseNumber} items submitted → ${step}`);
    return step;
  }

  // Moves a purchase collecting quotations to SOURCING once enough suppliers have posted one
  async completeQuotations(purchase: PurchaseRow, postedSupplierCount: number): Promise<void> {
    this.assertInStep(purchase, [PurchaseStepValues.QUOTING], 'Cannot Complete Quotations');
    if (postedSupplierCount < purchase.minQuotations) {
      throw new BadRequestException({
        label: 'Not Enough Quotations',
        detail: `"${purchase.purchaseNumber}" needs posted quotations from ${pluralize('supplier', purchase.minQuotations, true)}; ${postedSupplierCount} posted so far.`,
      });
    }
    await this.repository.update(purchase.id, { step: PurchaseStepValues.SOURCING });
    this.logger.log(`Purchase ${purchase.purchaseNumber} quotations completed → SOURCING`);
  }

  // Moves a purchase in SOURCING to PROCURING when it has legs to start; the caller starts them in the same transaction
  async submit(purchase: PurchaseRow, startableLegCount: number): Promise<void> {
    this.assertInStep(purchase, [PurchaseStepValues.SOURCING], 'Cannot Submit Purchase');
    if (startableLegCount === 0) {
      throw new BadRequestException({
        label: 'Nothing Sourced',
        detail: `Allocate the items of "${purchase.purchaseNumber}" to at least one supplier before submitting it.`,
      });
    }
    await this.repository.update(purchase.id, { step: PurchaseStepValues.PROCURING, submittedAt: new Date() });
    this.logger.log(`Purchase ${purchase.purchaseNumber} submitted → PROCURING`);
  }

  // Cancels an open purchase; nothing is received or invoiced before fulfilment actions exist
  async cancel(purchase: PurchaseRow, reason: string): Promise<void> {
    if (purchase.status !== PurchaseStatusValues.OPEN) {
      throw new ConflictException({
        label: 'Cannot Cancel Purchase',
        detail: `"${purchase.purchaseNumber}" is already ${purchase.status}.`,
      });
    }
    await this.repository.update(purchase.id, {
      status: PurchaseStatusValues.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
    });
    this.logger.log(`Cancelled purchase ${purchase.purchaseNumber}`);
  }

  // Completes an open purchase once every one of its legs is closed, in the caller's transaction; returns whether it did
  async completeIfLegsClosed(purchase: PurchaseState & Pick<Purchase, 'id'>, allLegsClosed: boolean): Promise<boolean> {
    if (purchase.status !== PurchaseStatusValues.OPEN || !allLegsClosed) return false;
    await this.repository.update(purchase.id, { status: PurchaseStatusValues.COMPLETED, completedAt: new Date() });
    this.logger.log(`Completed purchase ${purchase.purchaseNumber}`);
    return true;
  }

  // Returns one purchase header
  async findById(id: string): Promise<PurchaseDto> {
    return PurchaseDto.from(await this.findDetailOrThrow(id));
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

  // Returns paginated purchase options, newest first; the `stage` description is the step while open and the status once closed
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const describesStage = !query.descriptionKey || query.descriptionKey === 'stage';
    return this.repository.findForSelect({
      ...selectPageOptions(query),
      value: query.valueKey || 'id',
      label: query.labelKey || 'purchaseNumber',
      description: describesStage ? PurchasesDomainService.STAGE_LABEL : query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      searchKeys: ['purchaseNumber'],
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Loads a purchase with its item count and quantities, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<PurchaseRow> {
    const purchase = await this.repository.findDetail(id);
    if (!purchase) throw new NotFoundException('Purchase not found.');
    return purchase;
  }

  // Loads a purchase with its counts, progress and leg and allocation facts, throwing when it is out of reach
  async findHeaderOrThrow(id: string): Promise<PurchaseHeaderRow> {
    const purchase = await this.repository.findHeader(id);
    if (!purchase) throw new NotFoundException('Purchase not found.');
    return purchase;
  }

  // Rejects a quotation request unless the purchase is collecting quotations
  assertCollectingQuotations(purchase: PurchaseState): void {
    this.assertInStep(purchase, [PurchaseStepValues.QUOTING], 'Cannot Request Quotation');
  }

  // Rejects a change a manual feature would make to a document a purchase created or completes (409)
  assertNotPartOfPurchase(document: string, purchaseNumbers: (string | null)[]): void {
    const numbers = _.uniq(purchaseNumbers.filter((number): number is string => number !== null));
    if (numbers.length === 0) return;
    throw new ConflictException({
      label: 'Belongs to a Purchase',
      detail: `${document} belongs to purchase ${numbers.map((number) => `"${number}"`).join(', ')}; change it through the purchase.`,
    });
  }

  // Lists the actions an open purchase offers in its step — delete while its items are not submitted yet, cancel after
  availableActions(purchase: PurchaseRow, facts: PurchaseActionFacts): PurchaseAction[] {
    if (purchase.status !== PurchaseStatusValues.OPEN) return [];
    const actions: PurchaseAction[] = [
      this.deleteBlocker(purchase) === null ? PurchaseActionValues.DELETE : PurchaseActionValues.CANCEL,
    ];
    if (purchase.step === PurchaseStepValues.REQUESTING) {
      actions.push(PurchaseActionValues.EDIT, PurchaseActionValues.EDIT_ITEMS);
      if (purchase.itemCount > 0) actions.push(PurchaseActionValues.SUBMIT_ITEMS);
    }
    if (purchase.step === PurchaseStepValues.QUOTING) {
      actions.push(PurchaseActionValues.REQUEST_QUOTATION);
      if (facts.postedSupplierCount >= purchase.minQuotations) actions.push(PurchaseActionValues.COMPLETE_QUOTATIONS);
    }
    if (purchase.step === PurchaseStepValues.SOURCING || purchase.step === PurchaseStepValues.PROCURING) {
      actions.push(PurchaseActionValues.EDIT_ALLOCATIONS);
    }
    if (purchase.step === PurchaseStepValues.SOURCING && facts.hasSourcingLeg) {
      actions.push(PurchaseActionValues.SUBMIT);
    }
    return actions;
  }

  // Deletes a purchase whose items are not submitted yet, its items going with it on the foreign key; the delete itself
  // re-checks the step, so a purchase submitted meanwhile is refused
  async delete(purchase: PurchaseRow): Promise<void> {
    const blocker = this.deleteBlocker(purchase);
    if (blocker) throw new ConflictException({ label: 'Cannot Delete Purchase', detail: blocker });
    if (!(await this.repository.deleteRequesting(purchase.id))) {
      throw new ConflictException({
        label: 'Cannot Delete Purchase',
        detail: `"${purchase.purchaseNumber}" was submitted meanwhile; cancel it instead.`,
      });
    }
    this.logger.log(`Deleted purchase ${purchase.purchaseNumber}`);
  }

  // Explains what keeps a purchase from being deleted, or returns null while it is open in REQUESTING: nothing — no
  // quotation, leg or allocation — can exist before its items are submitted
  private deleteBlocker(purchase: PurchaseState): string | null {
    const name = `"${purchase.purchaseNumber}"`;
    if (purchase.status !== PurchaseStatusValues.OPEN) return `${name} is ${purchase.status.toLowerCase()}.`;
    if (purchase.step !== PurchaseStepValues.REQUESTING) {
      return `${name} is in ${PurchaseStepLabels[purchase.step]}; cancel it instead.`;
    }
    return null;
  }

  // Rejects an action unless the purchase is open in one of the given steps (409)
  private assertInStep(purchase: PurchaseState, steps: PurchaseStep[], label: string): void {
    if (purchase.status === PurchaseStatusValues.OPEN && steps.includes(purchase.step)) return;
    const state =
      purchase.status === PurchaseStatusValues.OPEN
        ? `in ${PurchaseStepLabels[purchase.step]}`
        : PurchaseStatusLabels[purchase.status].toLowerCase();
    throw new ConflictException({
      label,
      detail: `"${purchase.purchaseNumber}" is ${state}; this is only possible while it is open in ${steps.map((step) => PurchaseStepLabels[step]).join(' or ')}.`,
    });
  }
}
