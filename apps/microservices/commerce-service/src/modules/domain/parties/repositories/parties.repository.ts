import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type NewPartyTaxRegistration,
  type Party,
  type PartyTaxRegistration,
  parties,
  partyTaxRegistrations,
  taxJurisdictions,
} from '@/db/schema';

@Injectable()
export class PartiesRepository extends PrimaryBaseRepository<typeof parties> {
  constructor(database: PrimaryDatabaseService) {
    super(database, parties);
  }

  // Paginated party options for the selector dropdown
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns paginated parties filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: Party[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated tax registrations joined with the jurisdiction name
  async findRegistrationsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (PartyTaxRegistration & { jurisdictionName: string | null })[]; count: number }> {
    const rowsPromise = this.db
      .select({ registration: partyTaxRegistrations, jurisdictionName: taxJurisdictions.name })
      .from(partyTaxRegistrations)
      .leftJoin(taxJurisdictions, eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId))
      .where(options.where)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyTaxRegistrations)
      .leftJoin(taxJurisdictions, eq(taxJurisdictions.id, partyTaxRegistrations.jurisdictionId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({ ...row.registration, jurisdictionName: row.jurisdictionName ?? null })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Creates a party tax registration row
  async createRegistration(data: NewPartyTaxRegistration): Promise<PartyTaxRegistration> {
    const [row] = await this.db.insert(partyTaxRegistrations).values(data).returning();
    return row as PartyTaxRegistration;
  }

  // Loads a single party tax registration by id
  async findRegistrationById(id: string): Promise<PartyTaxRegistration | undefined> {
    const [row] = await this.db.select().from(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id)).limit(1);
    return row as PartyTaxRegistration | undefined;
  }

  // Updates a party tax registration row
  async updateRegistration(id: string, data: Partial<PartyTaxRegistration>): Promise<PartyTaxRegistration> {
    const [row] = await this.db
      .update(partyTaxRegistrations)
      .set(data)
      .where(eq(partyTaxRegistrations.id, id))
      .returning();
    return row as PartyTaxRegistration;
  }

  // Deletes a party tax registration row
  async deleteRegistration(id: string): Promise<void> {
    await this.db.delete(partyTaxRegistrations).where(eq(partyTaxRegistrations.id, id));
  }
}
