import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type NewPartyRelationship, type PartyRelationship, parties, partyRelationships } from '@/db/schema';

@Injectable()
export class PartyRelationshipsDomainRepository extends PrimaryBaseRepository<typeof partyRelationships> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyRelationships);
  }

  // Returns paginated relationships joined with the child person's display name
  async findRelationshipsForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (PartyRelationship & { childName: string | null })[]; count: number }> {
    const rowsPromise = this.db
      .select({ relationship: partyRelationships, childName: parties.displayName })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.childPartyId))
      .where(options.where)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.childPartyId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({ ...row.relationship, childName: row.childName ?? null })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Returns paginated relationships joined with the parent company's display name
  async findCompaniesForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (PartyRelationship & { companyName: string | null })[];
    count: number;
  }> {
    const rowsPromise = this.db
      .select({
        relationship: partyRelationships,
        companyName: parties.displayName,
      })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.parentPartyId))
      .where(options.where)
      .orderBy(...(options.orderBy ?? []))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(partyRelationships)
      .leftJoin(parties, eq(parties.id, partyRelationships.parentPartyId))
      .where(options.where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return {
      result: rows.map((row) => ({
        ...row.relationship,
        companyName: row.companyName ?? null,
      })),
      count: countResult[0]?.count ?? 0,
    };
  }

  // Returns whether a party exists by id
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return !!row;
  }

  // Creates a party relationship row
  async addRelationship(data: NewPartyRelationship): Promise<PartyRelationship> {
    const [row] = await this.db.insert(partyRelationships).values(data).returning();
    return row as PartyRelationship;
  }

  // Loads a single party relationship by id
  async findRelationshipById(id: string): Promise<PartyRelationship | undefined> {
    const [row] = await this.db.select().from(partyRelationships).where(eq(partyRelationships.id, id)).limit(1);
    return row as PartyRelationship | undefined;
  }

  // Deletes a party relationship row
  async removeRelationship(id: string): Promise<void> {
    await this.db.delete(partyRelationships).where(eq(partyRelationships.id, id));
  }
}
