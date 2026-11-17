import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import {
  type Purchase,
  PurchaseStatusValues,
  purchaseItemProgress,
  purchaseItems,
  purchaseNumberSeq,
  purchaseSuppliers,
  purchases,
} from '@/db/schema';
import { PurchaseStatusLabels } from '../dto/entity/purchase.dto';

export type PurchaseRow = Purchase & { itemCount: number };

export type PurchaseProgressItemRow = {
  requested: number;
  allocated: number;
  ordered: number;
  inTransit: number;
  received: number;
  invoiced: number;
};

export type PurchaseProgressRow = {
  items: PurchaseProgressItemRow[];
};

export type PurchaseTableRow = PurchaseRow & { progress: PurchaseProgressRow };

export type PurchaseCountsRow = { itemCount: number; supplierCount: number };

export type PurchaseProgressDetailRow = Pick<PurchaseTableRow, 'status' | 'itemCount' | 'progress'>;

export type PurchaseState = Pick<Purchase, 'purchaseNumber' | 'status'>;

export interface PurchaseBlockers {
  submit: string | null;
  close: string | null;
  cancel: string | null;
  delete: string | null;
}

@Injectable()
export class PurchasesDomainRepository extends PrimaryBaseRepository<typeof purchases> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchases, { sequence: purchaseNumberSeq });
  }

  // Generates the next sequential purchase number for the current month
  async generatePurchaseNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PUR-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Loads a purchase with its item line count
  findDetail(id: string): Promise<PurchaseRow | undefined> {
    return this.findById<PurchaseRow>(id, { select: this.selection() });
  }

  // Loads the given purchases with their item line counts
  findDetailsByIds(ids: string[]): Promise<PurchaseRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findAllWithSelect<PurchaseRow>({ select: this.selection(), where: inArray(purchases.id, ids) });
  }

  // Counts a purchase's item lines and legs
  findCounts(id: string): Promise<PurchaseCountsRow | undefined> {
    return this.findById<PurchaseCountsRow>(id, {
      select: {
        itemCount: this.db.$count(purchaseItems, eq(purchaseItems.purchaseId, purchases.id)),
        supplierCount: this.db.$count(purchaseSuppliers, eq(purchaseSuppliers.purchaseId, purchases.id)),
      },
    });
  }

  // Loads a purchase's status with its item line count and progress
  findProgress(id: string): Promise<PurchaseProgressDetailRow | undefined> {
    return this.findById<PurchaseProgressDetailRow>(id, {
      select: {
        status: purchases.status,
        itemCount: this.db.$count(purchaseItems, eq(purchaseItems.purchaseId, purchases.id)),
        progress: this.progress(),
      },
    });
  }

  // Returns one page of purchases with their item line counts and their progress
  findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PurchaseTableRow[]; count: number }> {
    return this.findAllAndCount<PurchaseTableRow>({
      select: { ...this.selection(), progress: this.progress() },
      ...options,
    });
  }

  // Rejects closing a purchase that cannot close now: not open, nothing received, or a supplier with goods on their way or
  // a draft open
  assertClosable(blockers: PurchaseBlockers): void {
    if (blockers.close) throw new ConflictException({ label: 'Cannot Close Purchase', detail: blockers.close });
  }

  // Loads a purchase with its item count and quantities, throwing when it is out of reach
  async findDetailOrThrow(id: string): Promise<PurchaseRow> {
    const purchase = await this.findDetail(id);
    if (!purchase) throw new NotFoundException('Purchase not found.');
    return purchase;
  }

  // Counts a purchase's item lines and legs, throwing when it is out of reach
  async findCountsOrThrow(id: string): Promise<PurchaseCountsRow> {
    const counts = await this.findCounts(id);
    if (!counts) throw new NotFoundException('Purchase not found.');
    return counts;
  }

  // Loads a purchase's status, item line count and progress, throwing when it is out of reach
  async findProgressOrThrow(id: string): Promise<PurchaseProgressDetailRow> {
    const progress = await this.findProgress(id);
    if (!progress) throw new NotFoundException('Purchase not found.');
    return progress;
  }

  // Rejects an action on a purchase that is no longer open (409)
  assertOpen(purchase: PurchaseState, label: string): void {
    if (purchase.status === PurchaseStatusValues.OPEN) return;
    throw new ConflictException({
      label,
      detail: `"${purchase.purchaseNumber}" is ${PurchaseStatusLabels[purchase.status].toLowerCase()}.`,
    });
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

  // Selects a purchase with its item line count
  private selection() {
    return {
      ...getColumns(purchases),
      itemCount: this.db.$count(purchaseItems, eq(purchaseItems.purchaseId, purchases.id)),
    };
  }

  // Selects the purchase's progress as JSON: each item's requested quantity and how much of it is allocated, ordered,
  // on its way, received and invoiced
  private progress(): SQL<PurchaseProgressRow> {
    const items = this.db
      .select({
        progress: sql`json_build_object('items', coalesce(json_agg(json_build_object(
          'requested', ${purchaseItems.primaryQty},
          'allocated', ${purchaseItemProgress.allocated()},
          'ordered', ${purchaseItemProgress.ordered()},
          'inTransit', ${purchaseItemProgress.inTransit()},
          'received', ${purchaseItemProgress.received()},
          'invoiced', ${purchaseItemProgress.invoiced()}
        )), '[]'::json))`,
      })
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchases.id));
    return sql<PurchaseProgressRow>`(${items})`;
  }
}
