import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bankAccounts,
  type PaymentChannelType,
  type PaymentGatewayConfig,
  type PayoutAccount,
  type PayoutChannelBankAccount,
  paymentGatewayConfigs,
  payoutAccounts,
  payoutChannelBankAccounts,
  payoutChannels,
} from '@/db/schema';

// A switched-on payout account with what decides whether its gateway config may take payments yet
export interface SwitchedOnPayoutAccount extends PayoutAccount {
  config: Pick<PaymentGatewayConfig, 'kind' | 'gatewayCode' | 'verifiedAt' | 'webhookVerifiedAt'>;
}

export interface PayoutChannelScope {
  legalEntityId: string;
  siteId: string | null;
  appId: string | null;
  channel: PaymentChannelType | null;
}

export interface PayoutChannelPaymentContext {
  legalEntityId: string;
  siteId?: string;
  appId?: string;
  channel: PaymentChannelType;
}

export type PayoutChannelDetail = PayoutChannelBankAccount & {
  bank: { id: string; bankName: string; accountNumber: string };
  payoutAccountIds: string[];
};

const DETAIL_JOINS = [{ table: bankAccounts, on: eq(bankAccounts.id, payoutChannelBankAccounts.bankAccountId) }];

@Injectable()
// A scope's bank account — core.payout_channel_bank_accounts — with the payout accounts switched on for it
export class PayoutChannelBankAccountDomainRepository extends PrimaryBaseRepository<typeof payoutChannelBankAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutChannelBankAccounts);
  }

  // The channel with its bank account and the payout accounts switched on for it, shared by every read
  private selection() {
    return {
      ...getColumns(payoutChannelBankAccounts),
      bank: {
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
      },
      payoutAccountIds: sql<string[]>`coalesce((
        select array_agg(${payoutChannels.payoutAccountId} order by ${payoutChannels.createdAt})
        from ${payoutChannels}
        where ${payoutChannels.payoutChannelBankAccountId} = ${payoutChannelBankAccounts.id}
      ), '{}')`,
    };
  }

  // Returns every channel of a legal entity, its sites' included, oldest first
  async findByLegalEntity(legalEntityId: string): Promise<PayoutChannelDetail[]> {
    return this.findAllWithSelect<PayoutChannelDetail>({
      select: this.selection(),
      innerJoins: DETAIL_JOINS,
      where: eq(payoutChannelBankAccounts.legalEntityId, legalEntityId),
      orderBy: [asc(payoutChannelBankAccounts.createdAt)],
    });
  }

  // Returns one channel with its bank account and switched-on payout accounts
  async findDetailById(id: string): Promise<PayoutChannelDetail | undefined> {
    return this.findById<PayoutChannelDetail>(id, { select: this.selection(), innerJoins: DETAIL_JOINS });
  }

  // Reports whether the scope already has a channel
  async findConflicts(scope: PayoutChannelScope): Promise<{ scopeTaken: boolean }> {
    const scopeTaken = await this.exists(
      and(
        eq(payoutChannelBankAccounts.legalEntityId, scope.legalEntityId),
        nullable(payoutChannelBankAccounts.siteId, scope.siteId),
        nullable(payoutChannelBankAccounts.appId, scope.appId),
        nullable(payoutChannelBankAccounts.channel, scope.channel),
      ) as SQL,
    );
    return { scopeTaken };
  }

  // Returns the channels a payment could use: its legal entity's, each open or equal on site, app and channel
  async findMatching(context: PayoutChannelPaymentContext): Promise<PayoutChannelBankAccount[]> {
    return this.db
      .select()
      .from(payoutChannelBankAccounts)
      .where(
        and(
          eq(payoutChannelBankAccounts.legalEntityId, context.legalEntityId),
          openOr(payoutChannelBankAccounts.siteId, context.siteId),
          openOr(payoutChannelBankAccounts.appId, context.appId),
          or(isNull(payoutChannelBankAccounts.channel), eq(payoutChannelBankAccounts.channel, context.channel)),
        ),
      );
  }

  // Returns the payout accounts switched on for a channel, optionally of one gateway only
  async findSwitchedOnAccounts(
    payoutChannelBankAccountId: string,
    gatewayCode?: string,
  ): Promise<SwitchedOnPayoutAccount[]> {
    const rows = await this.db
      .select({
        account: getColumns(payoutAccounts),
        config: {
          kind: paymentGatewayConfigs.kind,
          gatewayCode: paymentGatewayConfigs.gatewayCode,
          verifiedAt: paymentGatewayConfigs.verifiedAt,
          webhookVerifiedAt: paymentGatewayConfigs.webhookVerifiedAt,
        },
      })
      .from(payoutChannels)
      .innerJoin(payoutAccounts, eq(payoutAccounts.id, payoutChannels.payoutAccountId))
      .innerJoin(paymentGatewayConfigs, eq(paymentGatewayConfigs.id, payoutAccounts.paymentGatewayConfigId))
      .where(
        and(
          eq(payoutChannels.payoutChannelBankAccountId, payoutChannelBankAccountId),
          gatewayCode ? eq(payoutAccounts.gatewayCode, gatewayCode) : undefined,
        ),
      );
    return rows.map((row) => ({ ...row.account, config: row.config }));
  }
}

// Matches a column equal to the value, or NULL when the value is NULL
function nullable<T>(column: Parameters<typeof eq>[0], value: T | null): SQL | undefined {
  return value === null ? isNull(column) : eq(column, value);
}

// Matches a column left open (NULL), or equal to the payment's value when it has one
function openOr(column: Parameters<typeof eq>[0], value: string | undefined): SQL | undefined {
  return value ? or(isNull(column), eq(column, value)) : isNull(column);
}
