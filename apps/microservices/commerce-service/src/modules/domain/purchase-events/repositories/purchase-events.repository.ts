import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, inArray } from '@vritti/api-sdk/drizzle-orm';
import { type PurchaseEvent, parties, purchaseEvents, purchaseSuppliers, suppliers } from '@/db/schema';
import { type PurchaseEventAction, PurchaseEventActionValues } from '../dto/entity/purchase-event.dto';

export type PurchaseEventRow = PurchaseEvent & { supplierName: string | null };

export type PurchaseEventFilter = {
  actions?: PurchaseEventAction[];
  purchaseSupplierId?: string;
};

@Injectable()
export class PurchaseEventsDomainRepository extends PrimaryBaseRepository<typeof purchaseEvents> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseEvents);
  }

  // Returns a purchase's events, newest first, each leg event with its supplier's name
  findByPurchaseId(purchaseId: string): Promise<PurchaseEventRow[]> {
    return this.findAllWithSelect<PurchaseEventRow>({
      select: this.selection(),
      leftJoins: this.supplierJoins(),
      where: eq(purchaseEvents.purchaseId, purchaseId),
      orderBy: this.newestFirst(),
    });
  }

  // Returns one page of a purchase's events narrowed to the given actions and leg when given, newest first, with the
  // count of all that match
  findPageForPurchase(
    purchaseId: string,
    filter: PurchaseEventFilter,
    page: { limit: number; offset: number },
  ): Promise<{ result: PurchaseEventRow[]; count: number }> {
    return this.findAllAndCount<PurchaseEventRow>({
      select: this.selection(),
      leftJoins: this.supplierJoins(),
      where: and(
        eq(purchaseEvents.purchaseId, purchaseId),
        filter.actions ? inArray(purchaseEvents.action, filter.actions) : undefined,
        filter.purchaseSupplierId ? eq(purchaseEvents.purchaseSupplierId, filter.purchaseSupplierId) : undefined,
      ),
      orderBy: this.newestFirst(),
      limit: page.limit,
      offset: page.offset,
    });
  }

  // Returns the latest time a leg was started, by the purchase submit or its own submit
  async findLastSubmission(purchaseSupplierId: string): Promise<PurchaseEvent | undefined> {
    const [event] = await this.db
      .select()
      .from(purchaseEvents)
      .where(
        and(
          eq(purchaseEvents.purchaseSupplierId, purchaseSupplierId),
          inArray(purchaseEvents.action, [PurchaseEventActionValues.SUBMIT, PurchaseEventActionValues.SUBMIT_SUPPLIER]),
        ),
      )
      .orderBy(...this.newestFirst())
      .limit(1);
    return event;
  }

  // Selects an event with its leg's supplier name
  private selection() {
    return { ...getColumns(purchaseEvents), supplierName: parties.displayName };
  }

  // Joins the leg an event belongs to, its supplier and the supplier's party for the name
  private supplierJoins() {
    return [
      { table: purchaseSuppliers, on: eq(purchaseSuppliers.id, purchaseEvents.purchaseSupplierId) },
      { table: suppliers, on: eq(suppliers.id, purchaseSuppliers.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
    ];
  }

  // Orders events newest first, the id breaking ties within one instant
  private newestFirst() {
    return [desc(purchaseEvents.createdAt), desc(purchaseEvents.id)];
  }
}
