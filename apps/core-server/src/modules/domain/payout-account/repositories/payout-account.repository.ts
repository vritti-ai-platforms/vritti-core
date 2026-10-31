import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, getColumns, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bankAccounts,
  legalEntities,
  type PayoutAccount,
  paymentGatewayConfigs,
  payoutAccounts,
  payoutChannels,
} from '@/db/schema';

export interface PayoutAccountHolder {
  legalEntityName: string;
  bankName: string;
  accountNumberLast4: string;
}

export type PayoutAccountDetail = PayoutAccount & {
  gateway: { id: string; kind: 'PLATFORM' | 'ORG'; gatewayCode: string };
  bank: { id: string; bankName: string; accountNumber: string };
  payoutChannelCount: number;
};

const DETAIL_JOINS = [
  { table: paymentGatewayConfigs, on: eq(paymentGatewayConfigs.id, payoutAccounts.paymentGatewayConfigId) },
  { table: bankAccounts, on: eq(bankAccounts.id, payoutAccounts.bankAccountId) },
];

@Injectable()
export class PayoutAccountDomainRepository extends PrimaryBaseRepository<typeof payoutAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutAccounts);
  }

  // The payout account with its gateway, bank and how many payout channels switch it on, shared by every read
  private selection() {
    return {
      ...getColumns(payoutAccounts),
      gateway: {
        id: paymentGatewayConfigs.id,
        kind: paymentGatewayConfigs.kind,
        gatewayCode: paymentGatewayConfigs.gatewayCode,
      },
      bank: {
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
      },
      payoutChannelCount: this.db.$count(payoutChannels, eq(payoutChannels.payoutAccountId, payoutAccounts.id)),
    };
  }

  // Returns one page of payout accounts with the total, newest first unless the caller sorts
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PayoutAccountDetail[]; count: number }> {
    return this.findAllAndCount<PayoutAccountDetail>({
      select: this.selection(),
      innerJoins: DETAIL_JOINS,
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(payoutAccounts.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Returns every payout account of a legal entity across its bank accounts, oldest first
  async findByLegalEntity(legalEntityId: string): Promise<PayoutAccountDetail[]> {
    return this.findAllWithSelect<PayoutAccountDetail>({
      select: this.selection(),
      innerJoins: DETAIL_JOINS,
      where: eq(payoutAccounts.legalEntityId, legalEntityId),
      orderBy: [asc(payoutAccounts.createdAt)],
    });
  }

  // Returns one payout account with its gateway, bank and payout channel count
  async findDetailById(id: string): Promise<PayoutAccountDetail | undefined> {
    return this.findById<PayoutAccountDetail>(id, { select: this.selection(), innerJoins: DETAIL_JOINS });
  }

  // Reports in one pass whether the bank account already uses the gateway, and which bank account holds the gateway
  // account when another payout account already names it
  async findConflicts(
    candidate: Pick<PayoutAccount, 'bankAccountId' | 'paymentGatewayConfigId' | 'gatewayCode' | 'gatewayAccountId'>,
    excludeId?: string,
  ): Promise<{ gatewayCodeTaken: boolean; gatewayAccountHolder: PayoutAccountHolder | null }> {
    const accountMatch = and(
      eq(payoutAccounts.paymentGatewayConfigId, candidate.paymentGatewayConfigId),
      eq(payoutAccounts.gatewayAccountId, candidate.gatewayAccountId),
    );
    const gatewayMatch = and(
      eq(payoutAccounts.bankAccountId, candidate.bankAccountId),
      eq(payoutAccounts.gatewayCode, candidate.gatewayCode),
    );
    const holderOf = (column: SQL | typeof bankAccounts.bankName) =>
      sql<string | null>`max(case when ${accountMatch} then ${column} end)`;
    const [row] = await this.db
      .select({
        gatewayCodeTaken: sql<boolean>`coalesce(bool_or(${gatewayMatch}), false)`,
        legalEntityName: holderOf(sql`${legalEntities.name}`),
        bankName: holderOf(bankAccounts.bankName),
        accountNumberLast4: holderOf(sql`right(${bankAccounts.accountNumber}, 4)`),
      })
      .from(payoutAccounts)
      .innerJoin(bankAccounts, eq(bankAccounts.id, payoutAccounts.bankAccountId))
      .innerJoin(legalEntities, eq(legalEntities.id, payoutAccounts.legalEntityId))
      .where(and(or(accountMatch, gatewayMatch), excludeId ? ne(payoutAccounts.id, excludeId) : undefined));
    const holder =
      row?.bankName && row.legalEntityName && row.accountNumberLast4
        ? { legalEntityName: row.legalEntityName, bankName: row.bankName, accountNumberLast4: row.accountNumberLast4 }
        : null;
    return { gatewayCodeTaken: row?.gatewayCodeTaken ?? false, gatewayAccountHolder: holder };
  }
}
