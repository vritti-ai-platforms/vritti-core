import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { asc, desc, eq, getTableColumns, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type PartyLicense,
  type PartyTaxRegistration,
  parties,
  partyLicenses,
  partyTaxRegistrations,
  purchaseOrders,
  type Supplier,
  supplierSites,
  suppliers,
} from '@/db/schema';

@Injectable()
export class SuppliersDomainRepository extends PrimaryBaseRepository<typeof suppliers> {
  constructor(database: PrimaryDatabaseService) {
    super(database, suppliers);
  }

  // Returns paginated supplier options — in site context only enrolled, purchase-unblocked suppliers
  // (fail-closed); `enrollable` flips the enrollment predicate for the site enroll dialog.
  override findForSelect(config: FindForSelectConfig, options?: { enrollable?: boolean }): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (options?.enrollable) {
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${supplierSites} ss
        WHERE ss.supplier_id = ${suppliers.id}
          AND ss.site_id = current_setting('app.site_id', true)::uuid
          AND ss.is_active = true
      )`);
    } else {
      conditions.push(sql`(current_setting('app.site_id', true) IS NULL OR EXISTS (
        SELECT 1 FROM ${supplierSites} ss
        WHERE ss.supplier_id = ${suppliers.id}
          AND ss.site_id = current_setting('app.site_id', true)::uuid
          AND ss.is_active = true
      ))`);
      conditions.push(sql`(current_setting('app.site_id', true) IS NULL OR ${suppliers.purchasingBlocked} = false)`);
    }

    return super.findForSelect({ ...config, conditions });
  }

  // Returns paginated suppliers joined with their party display name, plus total count
  findAllWithParty(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (Supplier & { partyName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<Supplier & { partyName: string | null }>({
      select: { ...getTableColumns(suppliers), partyName: parties.displayName },
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

  // Loads a supplier with party name, the party's registrations and licenses, and its active enrollment count
  async findDetailById(id: string): Promise<
    | (Supplier & {
        partyName: string | null;
        registrations: PartyTaxRegistration[];
        licenses: PartyLicense[];
        enrolledSiteCount: number;
      })
    | undefined
  > {
    const [row] = await this.db
      .select({
        ...getTableColumns(suppliers),
        partyName: parties.displayName,
        enrolledSiteCount: sql<number>`(
          SELECT count(*)::int FROM ${supplierSites} ss
          WHERE ss.supplier_id = ${suppliers.id} AND ss.is_active = true
        )`.mapWith(Number),
      })
      .from(suppliers)
      .leftJoin(parties, eq(parties.id, suppliers.partyId))
      .where(eq(suppliers.id, id))
      .limit(1);
    if (!row) return undefined;

    const supplier = row as Supplier & { partyName: string | null; enrolledSiteCount: number };
    const [registrations, licenses] = await Promise.all([
      this.db
        .select()
        .from(partyTaxRegistrations)
        .where(eq(partyTaxRegistrations.partyId, supplier.partyId))
        .orderBy(desc(partyTaxRegistrations.isPrimary), asc(partyTaxRegistrations.createdAt)),
      this.db
        .select()
        .from(partyLicenses)
        .where(eq(partyLicenses.partyId, supplier.partyId))
        .orderBy(asc(partyLicenses.createdAt)),
    ]);

    return {
      ...supplier,
      registrations: registrations as PartyTaxRegistration[],
      licenses: licenses as PartyLicense[],
    };
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
