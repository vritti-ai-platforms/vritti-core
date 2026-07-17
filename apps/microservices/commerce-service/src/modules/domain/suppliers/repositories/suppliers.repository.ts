import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { parties, purchaseOrders, type Supplier, suppliers } from '@/db/schema';

@Injectable()
export class SuppliersRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Returns paginated supplier options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated suppliers joined with their party display name, plus total count
  findAllWithParty(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (Supplier & { partyName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<Supplier & { partyName: string | null }>({
      select: { ...suppliers, partyName: parties.displayName },
      leftJoins: [{ table: parties, on: eq(parties.id, suppliers.partyId) }],
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Loads a supplier by id joined with its party display name
  async findByIdWithParty(id: string): Promise<(Supplier & { partyName: string | null }) | undefined> {
    const { result } = await this.findAllWithParty({ where: eq(suppliers.id, id), limit: 1, offset: 0 });
    return result[0];
  }

  // Counts non-cascading references to this supplier
  async countReferences(id: string): Promise<{ purchaseOrders: number }> {
    const poResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.supplierId, id));

    return {
      purchaseOrders: Number(poResult[0]?.count ?? 0),
    };
  }
}
