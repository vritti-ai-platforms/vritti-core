import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, count, eq, isNull, ne, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bankAccounts,
  type PaymentChannelType,
  type PayoutAccount,
  type PayoutChannel,
  paymentGatewayConfigs,
  payoutAccounts,
  payoutChannels,
} from '@/db/schema';

// Where a payout channel sits: its legal entity and the optional site, app and channel it narrows itself to
export interface PayoutChannelScope {
  legalEntityId: string;
  siteId: string | null;
  appId: string | null;
  channel: PaymentChannelType | null;
}

// What a payment knows about itself when it looks for a payout channel
export interface PayoutChannelPaymentContext {
  legalEntityId: string;
  siteId?: string;
  appId?: string;
  channel: PaymentChannelType;
}

// A payout channel with the payout account it uses, and that account's gateway and bank, as the screens show it
export interface PayoutChannelDetail extends PayoutChannel {
  account: Pick<PayoutAccount, 'id' | 'gatewayAccountId' | 'isMainAccount' | 'paymentGatewayConfigId'>;
  gateway: { id: string; kind: 'PLATFORM' | 'ORG'; gatewayCode: string; label: string };
  bank: { id: string; label: string | null; bankName: string; accountNumber: string };
}

// A payout channel a payment could use, with the payout account behind it
export interface PayoutChannelCandidate {
  channel: PayoutChannel;
  account: PayoutAccount;
}

@Injectable()
export class PayoutChannelDomainRepository extends PrimaryBaseRepository<typeof payoutChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutChannels);
  }

  // Every payout channel of a legal entity, its sites' included
  async findDetailedByLegalEntity(legalEntityId: string): Promise<PayoutChannelDetail[]> {
    return this.selectDetailed(eq(payoutChannels.legalEntityId, legalEntityId));
  }

  async findDetailedById(id: string): Promise<PayoutChannelDetail | undefined> {
    const [row] = await this.selectDetailed(eq(payoutChannels.id, id));
    return row;
  }

  // The payout channel that already covers a scope through a gateway, skipping the one being changed
  async findInScopeForGateway(
    scope: PayoutChannelScope,
    paymentGatewayConfigId: string,
    excludeId?: string,
  ): Promise<PayoutChannel | undefined> {
    const [row] = await this.db
      .select({ channel: payoutChannels })
      .from(payoutChannels)
      .innerJoin(payoutAccounts, eq(payoutAccounts.id, payoutChannels.payoutAccountId))
      .where(
        and(
          eq(payoutChannels.legalEntityId, scope.legalEntityId),
          eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId),
          nullable(payoutChannels.siteId, scope.siteId),
          nullable(payoutChannels.appId, scope.appId),
          nullable(payoutChannels.channel, scope.channel),
          excludeId ? ne(payoutChannels.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return row?.channel;
  }

  // The payout channels a payment could use: its legal entity's, each open on site, app and channel or equal to the
  // payment's, optionally for one gateway only
  async findCandidates(
    context: PayoutChannelPaymentContext,
    paymentGatewayConfigId?: string,
  ): Promise<PayoutChannelCandidate[]> {
    return this.db
      .select({ channel: payoutChannels, account: payoutAccounts })
      .from(payoutChannels)
      .innerJoin(payoutAccounts, eq(payoutAccounts.id, payoutChannels.payoutAccountId))
      .where(
        and(
          eq(payoutChannels.legalEntityId, context.legalEntityId),
          paymentGatewayConfigId ? eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId) : undefined,
          openOr(payoutChannels.siteId, context.siteId),
          openOr(payoutChannels.appId, context.appId),
          or(isNull(payoutChannels.channel), eq(payoutChannels.channel, context.channel)),
        ),
      );
  }

  // How many payout channels use a payout account
  async countByPayoutAccount(payoutAccountId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(payoutChannels)
      .where(eq(payoutChannels.payoutAccountId, payoutAccountId));
    return Number(result?.value ?? 0);
  }

  // Serializes payout-channel writes of one legal entity for the rest of the transaction, so two saves cannot both
  // pass the one-gateway-per-scope check
  async lockLegalEntity(legalEntityId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtext(${legalEntityId}))`);
  }

  private async selectDetailed(where: SQL): Promise<PayoutChannelDetail[]> {
    const rows = await this.db
      .select({
        channel: payoutChannels,
        account: {
          id: payoutAccounts.id,
          gatewayAccountId: payoutAccounts.gatewayAccountId,
          isMainAccount: payoutAccounts.isMainAccount,
          paymentGatewayConfigId: payoutAccounts.paymentGatewayConfigId,
        },
        gateway: {
          id: paymentGatewayConfigs.id,
          kind: paymentGatewayConfigs.kind,
          gatewayCode: paymentGatewayConfigs.gatewayCode,
          label: paymentGatewayConfigs.label,
        },
        bank: {
          id: bankAccounts.id,
          label: bankAccounts.label,
          bankName: bankAccounts.bankName,
          accountNumber: bankAccounts.accountNumber,
        },
      })
      .from(payoutChannels)
      .innerJoin(payoutAccounts, eq(payoutAccounts.id, payoutChannels.payoutAccountId))
      .innerJoin(paymentGatewayConfigs, eq(paymentGatewayConfigs.id, payoutAccounts.paymentGatewayConfigId))
      .innerJoin(bankAccounts, eq(bankAccounts.id, payoutAccounts.bankAccountId))
      .where(where)
      .orderBy(asc(payoutChannels.createdAt));
    return rows.map(({ channel, account, gateway, bank }) => ({ ...channel, account, gateway, bank }));
  }
}

// A column equal to the value, or NULL when the value is NULL
function nullable<T>(column: Parameters<typeof eq>[0], value: T | null): SQL | undefined {
  return value === null ? isNull(column) : eq(column, value);
}

// A column left open (NULL), or equal to the payment's value when it has one
function openOr(column: Parameters<typeof eq>[0], value: string | undefined): SQL | undefined {
  return value ? or(isNull(column), eq(column, value)) : isNull(column);
}
