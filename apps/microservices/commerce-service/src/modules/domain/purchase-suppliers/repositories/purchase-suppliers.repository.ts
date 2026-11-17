import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, count, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import {
  currentSiteId,
  type Purchase,
  type PurchaseLegStatus,
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseStatusValues,
  type PurchaseSupplier,
  type PurchaseType,
  parties,
  purchaseItemAllocations,
  purchaseSuppliers,
  purchases,
  suppliers,
} from '@/db/schema';

export type LegPurchase = Pick<Purchase, 'id' | 'purchaseNumber' | 'status'>;

export interface LegEnrollmentSnapshot {
  enrollmentId: string;
  isActive: boolean;
  isSupplierActive: boolean;
  purchasingBlocked: boolean;
  purchaseType: PurchaseType;
  approvalEnabled: boolean;
  approvalThreshold: bigint | null;
  qualityCheckEnabled: boolean;
}

export type PurchaseSupplierRow = PurchaseSupplier & { supplierName: string };

export type PurchaseSupplierTableRow = PurchaseSupplierRow & { lineCount: number };

export interface PurchaseLegCount {
  step: PurchaseLegStep;
  status: PurchaseLegStatus;
  count: number;
  lineCount: number;
}

@Injectable()
export class PurchaseSuppliersDomainRepository extends PrimaryBaseRepository<typeof purchaseSuppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseSuppliers);
  }

  // Returns the legs of a purchase with their suppliers' names, oldest first
  findByPurchaseId(purchaseId: string): Promise<PurchaseSupplierRow[]> {
    return this.findAllWithSelect<PurchaseSupplierRow>({
      select: this.selection(),
      innerJoins: this.supplierJoins(),
      where: eq(purchaseSuppliers.purchaseId, purchaseId),
      orderBy: [asc(purchaseSuppliers.createdAt)],
    });
  }

  // Returns one page of a purchase's legs with their suppliers' names and allocated line counts, filtered and ordered by
  // already-built clauses
  findForTable(
    purchaseId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: PurchaseSupplierTableRow[]; count: number }> {
    return this.findAllAndCount<PurchaseSupplierTableRow>({
      select: {
        ...this.selection(),
        lineCount: this.db.$count(
          purchaseItemAllocations,
          eq(purchaseItemAllocations.purchaseSupplierId, purchaseSuppliers.id),
        ),
      },
      innerJoins: this.supplierJoins(),
      where: and(eq(purchaseSuppliers.purchaseId, purchaseId), options.where),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Counts a purchase's legs and their allocated lines by step and status
  findCounts(purchaseId: string): Promise<PurchaseLegCount[]> {
    return this.db
      .select({
        step: purchaseSuppliers.step,
        status: purchaseSuppliers.status,
        count: count(),
        lineCount:
          sql<number>`sum(${this.db.$count(purchaseItemAllocations, eq(purchaseItemAllocations.purchaseSupplierId, purchaseSuppliers.id))})::int`.mapWith(
            Number,
          ),
      })
      .from(purchaseSuppliers)
      .where(eq(purchaseSuppliers.purchaseId, purchaseId))
      .groupBy(purchaseSuppliers.step, purchaseSuppliers.status);
  }

  // Loads a leg of the given purchase with its supplier's name
  findDetailOnPurchase(purchaseId: string, legId: string): Promise<PurchaseSupplierRow | undefined> {
    return this.findById<PurchaseSupplierRow>(legId, {
      select: this.selection(),
      innerJoins: this.supplierJoins(),
      where: eq(purchaseSuppliers.purchaseId, purchaseId),
    });
  }

  // Returns the open legs of a supplier on the open purchases of the named site, else the request's, oldest first
  findOpenForSupplierAtSite(supplierId: string, siteId?: string): Promise<PurchaseSupplierRow[]> {
    return this.findAllWithSelect<PurchaseSupplierRow>({
      select: this.selection(),
      innerJoins: [...this.supplierJoins(), { table: purchases, on: eq(purchases.id, purchaseSuppliers.purchaseId) }],
      where: and(
        eq(purchaseSuppliers.supplierId, supplierId),
        eq(purchaseSuppliers.status, PurchaseLegStatusValues.OPEN),
        eq(purchases.siteId, siteId ?? currentSiteId()),
        eq(purchases.status, PurchaseStatusValues.OPEN),
      ),
      orderBy: [asc(purchaseSuppliers.createdAt)],
    });
  }

  // Loads the legs of a supplier on any of the given purchases
  findForSupplierOnPurchases(purchaseIds: string[], supplierId: string): Promise<PurchaseSupplier[]> {
    if (purchaseIds.length === 0) return Promise.resolve([]);
    return this.db
      .select()
      .from(purchaseSuppliers)
      .where(and(inArray(purchaseSuppliers.purchaseId, purchaseIds), eq(purchaseSuppliers.supplierId, supplierId)));
  }

  // Loads the leg of a supplier on a purchase
  findForSupplier(purchaseId: string, supplierId: string): Promise<PurchaseSupplier | undefined> {
    return this.findOne({ purchaseId, supplierId });
  }

  // Loads a leg of the given purchase, throwing when it is not on it
  async findOnPurchaseOrThrow(purchaseId: string, legId: string): Promise<PurchaseSupplierRow> {
    const leg = await this.findDetailOnPurchase(purchaseId, legId);
    if (!leg) throw new NotFoundException('Supplier not found on this purchase.');
    return leg;
  }

  // Returns the enrollment of a supplier at the purchase's site, rejecting a supplier not actively enrolled there or
  // blocked from purchasing
  requireActiveEnrollment(snapshot: LegEnrollmentSnapshot | undefined): LegEnrollmentSnapshot {
    if (!snapshot?.isActive || !snapshot.isSupplierActive) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: snapshot
          ? "The supplier's enrollment at this site is inactive. Activate it before buying from the supplier here."
          : 'The supplier is not enrolled at this site. Enroll it before buying from it here.',
        errors: [{ field: 'supplierId', message: 'Not enrolled at this site' }],
      });
    }
    if (snapshot.purchasingBlocked) {
      throw new BadRequestException({
        label: 'Supplier Blocked',
        detail: 'Purchasing from this supplier is blocked. Unblock the supplier before buying from it.',
        errors: [{ field: 'supplierId', message: 'Blocked from purchasing' }],
      });
    }
    return snapshot;
  }

  // Rejects starting a leg while some of its items have fewer quotations than the purchase requires
  assertQuotedEnough(
    leg: Pick<PurchaseSupplier, 'id'> & { supplierName: string },
    shortCount: number,
    minQuotations: number,
  ): void {
    if (shortCount === 0) return;
    throw new BadRequestException({
      label: 'Not Enough Quotations',
      detail: `Fewer than ${pluralize('posted quotation', minQuotations, true)} for ${pluralize('item', shortCount, true)} on ${leg.supplierName}; request more before submitting.`,
    });
  }

  // Rejects an action on a leg of a purchase that is no longer open (409)
  assertPurchaseOpen(purchase: LegPurchase, label: string): void {
    if (purchase.status === PurchaseStatusValues.OPEN) return;
    throw new ConflictException({
      label,
      detail: `"${purchase.purchaseNumber}" is ${purchase.status.toLowerCase()}.`,
    });
  }

  // Selects a leg with its supplier's name
  private selection() {
    return { ...getColumns(purchaseSuppliers), supplierName: parties.displayName };
  }

  // Joins the supplier and its party for the supplier name
  private supplierJoins() {
    return [
      { table: suppliers, on: eq(suppliers.id, purchaseSuppliers.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
    ];
  }
}
