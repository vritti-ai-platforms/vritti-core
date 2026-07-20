import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq, ilike, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type PartyContact, type PartyContactPurpose, parties, partyContacts } from '@/db/schema';

@Injectable()
export class PartyContactsDomainRepository extends PrimaryBaseRepository<typeof partyContacts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyContacts);
  }

  // Returns paginated contacts filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyContact[];
    count: number;
  }> {
    return this.findAllAndCount({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns true when the owning party exists
  async partyExists(partyId: string): Promise<boolean> {
    const [row] = await this.db.select({ id: parties.id }).from(parties).where(eq(parties.id, partyId)).limit(1);
    return Boolean(row);
  }

  // Returns the primary contact of a party for a purpose, if one is set
  async findPrimaryByPartyId(partyId: string, purpose: PartyContactPurpose): Promise<PartyContact | undefined> {
    const [row] = await this.db
      .select()
      .from(partyContacts)
      .where(
        and(eq(partyContacts.partyId, partyId), eq(partyContacts.purpose, purpose), eq(partyContacts.isPrimary, true)),
      )
      .limit(1);
    return row as PartyContact | undefined;
  }

  // Clears is_primary on a party's other contacts of the same purpose before flipping a new one to primary
  async clearPrimaryForPartyPurpose(partyId: string, purpose: PartyContactPurpose, exceptId?: string): Promise<void> {
    const base = and(eq(partyContacts.partyId, partyId), eq(partyContacts.purpose, purpose));
    const where = exceptId ? and(base, ne(partyContacts.id, exceptId)) : base;
    await this.db.update(partyContacts).set({ isPrimary: false }).where(where);
  }

  // Returns paginated active contact options of a party — label falls back to name/email, description shows email/phone
  async findOptionsForSelect(
    partyId: string,
    query: SelectOptionsQueryDto,
    purpose?: PartyContactPurpose,
  ): Promise<SelectQueryResult> {
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const conditions: SQL[] = [eq(partyContacts.partyId, partyId), eq(partyContacts.isActive, true)];
    if (purpose) conditions.push(eq(partyContacts.purpose, purpose));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(ilike(partyContacts.label, term), ilike(partyContacts.name, term), ilike(partyContacts.email, term)) as SQL,
      );
    }

    const rows = await this.db
      .select({
        value: partyContacts.id,
        label: sql<string>`COALESCE(${partyContacts.label}, ${partyContacts.name}, ${partyContacts.email}, 'Contact')`,
        description: sql<string>`COALESCE(${partyContacts.email}, ${partyContacts.phone})`,
        isPrimary: partyContacts.isPrimary,
        totalCount: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(partyContacts)
      .where(and(...conditions))
      .orderBy(desc(partyContacts.isPrimary), asc(partyContacts.label))
      .limit(limit)
      .offset(offset);

    const totalCount = rows.length > 0 ? rows[0].totalCount : 0;
    return {
      options: rows.map((row) => ({
        value: row.value,
        label: row.label,
        description: row.description,
        additionals: { isPrimary: row.isPrimary },
      })),
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  }
}
