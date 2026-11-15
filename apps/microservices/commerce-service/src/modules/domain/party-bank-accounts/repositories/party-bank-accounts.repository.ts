import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type SelectOptionsQueryDto, type SelectQueryResult, selectPageOptions } from '@vritti/api-sdk/select';
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

  // Returns a party's active bank accounts as select options, primary first — account name label, bank + masked number description
  findOptionsForSelect(partyId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.findForSelect({
      ...selectPageOptions(query),
      value: 'id',
      label: 'accountName',
      description: sql`coalesce(${partyBankAccounts.bankName} || ' ', '') || '····' || right(${partyBankAccounts.accountNumber}, 4)`,
      additionalKeys: ['isPrimary'],
      searchKeys: ['accountName'],
      orderBy: { isPrimary: 'desc', accountName: 'asc' },
      where: { partyId, isActive: true },
    });
  }
}
