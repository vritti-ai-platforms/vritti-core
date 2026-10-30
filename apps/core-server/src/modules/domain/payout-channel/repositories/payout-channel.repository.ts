import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bankAccounts,
  type PaymentChannelType,
  type PaymentGatewayConfig,
  type PayoutAccount,
  type PayoutChannel,
  paymentGatewayConfigs,
  payoutAccounts,
  payoutChannelAccounts,
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

export type PayoutChannelDetail = PayoutChannel & {
  bank: { id: string; bankName: string; accountNumber: string };
  payoutAccountIds: string[];
};

const DETAIL_JOINS = [{ table: bankAccounts, on: eq(bankAccounts.id, payoutChannels.bankAccountId) }];

@Injectable()
export class PayoutChannelDomainRepository extends PrimaryBaseRepository<typeof payoutChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutChannels);
  }

  // The channel with its bank account and the payout accounts switched on for it, shared by every read
  private selection() {
    return {
      ...getColumns(payoutChannels),
      bank: {
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
      },
      payoutAccountIds: sql<string[]>`coalesce((
        select array_agg(${payoutChannelAccounts.payoutAccountId} order by ${payoutChannelAccounts.createdAt})
        from ${payoutChannelAccounts}
        where ${payoutChannelAccounts.payoutChannelId} = ${payoutChannels.id}
      ), '{}')`,
    };
  }

  // Returns every channel of a legal entity, its sites' included, oldest first
  async findByLegalEntity(legalEntityId: string): Promise<PayoutChannelDetail[]> {
    return this.findAllWithSelect<PayoutChannelDetail>({
      select: this.selection(),
      innerJoins: DETAIL_JOINS,
      where: eq(payoutChannels.legalEntityId, legalEntityId),
      orderBy: [asc(payoutChannels.createdAt)],
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
        eq(payoutChannels.legalEntityId, scope.legalEntityId),
        nullable(payoutChannels.siteId, scope.siteId),
        nullable(payoutChannels.appId, scope.appId),
        nullable(payoutChannels.channel, scope.channel),
      ) as SQL,
    );
    return { scopeTaken };
  }

  // Returns the channels a payment could use: its legal entity's, each open or equal on site, app and channel
  async findMatching(context: PayoutChannelPaymentContext): Promise<PayoutChannel[]> {
    return this.db
      .select()
      .from(payoutChannels)
      .where(
        and(
          eq(payoutChannels.legalEntityId, context.legalEntityId),
          openOr(payoutChannels.siteId, context.siteId),
          openOr(payoutChannels.appId, context.appId),
          or(isNull(payoutChannels.channel), eq(payoutChannels.channel, context.channel)),
        ),
      );
  }

  // Returns the payout accounts switched on for a channel, optionally of one gateway only
  async findSwitchedOnAccounts(payoutChannelId: string, gatewayCode?: string): Promise<SwitchedOnPayoutAccount[]> {
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
      .from(payoutChannelAccounts)
      .innerJoin(payoutAccounts, eq(payoutAccounts.id, payoutChannelAccounts.payoutAccountId))
      .innerJoin(paymentGatewayConfigs, eq(paymentGatewayConfigs.id, payoutAccounts.paymentGatewayConfigId))
      .where(
        and(
          eq(payoutChannelAccounts.payoutChannelId, payoutChannelId),
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
