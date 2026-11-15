import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns } from '@vritti/api-sdk/drizzle-orm';
import {
  currentSiteId,
  PurchaseLegStatusValues,
  PurchaseStatusValues,
  type PurchaseSupplier,
  parties,
  purchaseSuppliers,
  purchases,
  suppliers,
} from '@/db/schema';

export type PurchaseSupplierRow = PurchaseSupplier & { supplierName: string };

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

  // Loads the leg of a supplier on a purchase
  findForSupplier(purchaseId: string, supplierId: string): Promise<PurchaseSupplier | undefined> {
    return this.findOne({ purchaseId, supplierId });
  }

  // Cancels every open leg of a purchase, returning how many were open
  async cancelOpen(purchaseId: string): Promise<number> {
    const cancelled = await this.db
      .update(purchaseSuppliers)
      .set({ status: PurchaseLegStatusValues.CANCELLED })
      .where(
        and(eq(purchaseSuppliers.purchaseId, purchaseId), eq(purchaseSuppliers.status, PurchaseLegStatusValues.OPEN)),
      )
      .returning({ id: purchaseSuppliers.id });
    return cancelled.length;
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
