import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq, ilike, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type PartyBankAccount, parties, partyBankAccounts } from '@/db/schema';

@Injectable()
export class PartyBankAccountsDomainRepository extends PrimaryBaseRepository<typeof partyBankAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, partyBankAccounts);
  }

  // Returns paginated bank accounts filtered by an already-built where clause
  findForTable(options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: PartyBankAccount[];
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

  // Returns all bank accounts of a party, primary first
  async findByPartyId(partyId: string): Promise<PartyBankAccount[]> {
    const rows = await this.db
      .select()
      .from(partyBankAccounts)
      .where(eq(partyBankAccounts.partyId, partyId))
      .orderBy(desc(partyBankAccounts.isPrimary), asc(partyBankAccounts.createdAt));
    return rows as PartyBankAccount[];
  }

  // Returns the primary bank account of a party, if one is set
  async findPrimaryByPartyId(partyId: string): Promise<PartyBankAccount | undefined> {
    const [row] = await this.db
      .select()
      .from(partyBankAccounts)
      .where(and(eq(partyBankAccounts.partyId, partyId), eq(partyBankAccounts.isPrimary, true)))
      .limit(1);
    return row as PartyBankAccount | undefined;
  }

  // Looks up a bank account by party and account number
  async findByPartyAndAccountNumber(partyId: string, accountNumber: string): Promise<PartyBankAccount | undefined> {
    const [row] = await this.db
      .select()
      .from(partyBankAccounts)
      .where(and(eq(partyBankAccounts.partyId, partyId), eq(partyBankAccounts.accountNumber, accountNumber)))
      .limit(1);
    return row as PartyBankAccount | undefined;
  }

  // Clears is_primary on all other bank accounts of a party before flipping a new one to primary
  async clearPrimaryForParty(partyId: string, exceptId?: string): Promise<void> {
    const where = exceptId
      ? and(eq(partyBankAccounts.partyId, partyId), ne(partyBankAccounts.id, exceptId))
      : eq(partyBankAccounts.partyId, partyId);
    await this.db.update(partyBankAccounts).set({ isPrimary: false }).where(where);
  }

  // Returns paginated active bank account options of a party — account name label, bank + masked number description
  async findOptionsForSelect(partyId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const conditions: SQL[] = [eq(partyBankAccounts.partyId, partyId), eq(partyBankAccounts.isActive, true)];
    if (query.search) {
      conditions.push(ilike(partyBankAccounts.accountName, `%${query.search}%`));
    }

    const rows = await this.db
      .select({
        value: partyBankAccounts.id,
        label: partyBankAccounts.accountName,
        description: sql<string>`COALESCE(${partyBankAccounts.bankName} || ' ', '') || '····' || RIGHT(${partyBankAccounts.accountNumber}, 4)`,
        isPrimary: partyBankAccounts.isPrimary,
        totalCount: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(partyBankAccounts)
      .where(and(...conditions))
      .orderBy(desc(partyBankAccounts.isPrimary), asc(partyBankAccounts.accountName))
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
