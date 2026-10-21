import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, count, eq, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { bankAccounts, type PayoutAccount, paymentGatewayConfigs, payoutAccounts } from '@/db/schema';

// A payout account with the gateway config and bank account it names, as the screens show it
export interface PayoutAccountDetail extends PayoutAccount {
  gateway: { id: string; kind: 'PLATFORM' | 'ORG'; gatewayCode: string; label: string };
  bank: { id: string; label: string | null; bankName: string; accountNumber: string };
}

@Injectable()
export class PayoutAccountDomainRepository extends PrimaryBaseRepository<typeof payoutAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, payoutAccounts);
  }

  // The payout accounts of one bank account, one per gateway account
  async findDetailedByBankAccount(bankAccountId: string): Promise<PayoutAccountDetail[]> {
    return this.selectDetailed(eq(payoutAccounts.bankAccountId, bankAccountId));
  }

  // Every payout account of a legal entity, across its bank accounts
  async findDetailedByLegalEntity(legalEntityId: string): Promise<PayoutAccountDetail[]> {
    return this.selectDetailed(eq(payoutAccounts.legalEntityId, legalEntityId));
  }

  async findDetailedById(id: string): Promise<PayoutAccountDetail | undefined> {
    const [row] = await this.selectDetailed(eq(payoutAccounts.id, id));
    return row;
  }

  // The payout account that already holds a gateway account, skipping the one being updated
  async findByGatewayAccount(
    paymentGatewayConfigId: string,
    gatewayAccountId: string,
    excludeId?: string,
  ): Promise<PayoutAccount | undefined> {
    const [row] = await this.db
      .select()
      .from(payoutAccounts)
      .where(
        and(
          eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId),
          eq(payoutAccounts.gatewayAccountId, gatewayAccountId),
          excludeId ? ne(payoutAccounts.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return row;
  }

  // The legal entities whose payout accounts of a gateway config name this account id
  async findLegalEntitiesNaming(paymentGatewayConfigId: string, gatewayAccountId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ legalEntityId: payoutAccounts.legalEntityId })
      .from(payoutAccounts)
      .where(
        and(
          eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId),
          eq(payoutAccounts.gatewayAccountId, gatewayAccountId),
        ),
      );
    return rows.map((row) => row.legalEntityId);
  }

  // Re-marks a gateway config's payout accounts after its main account id changed
  async remarkMainAccount(paymentGatewayConfigId: string, mainAccountId: string): Promise<void> {
    await this.db
      .update(payoutAccounts)
      .set({ isMainAccount: sql`${payoutAccounts.gatewayAccountId} = ${mainAccountId}` })
      .where(eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId));
  }

  // Points the payout account of a gateway that cannot split at its new main account, the only one it pays into
  async moveToMainAccount(paymentGatewayConfigId: string, mainAccountId: string): Promise<void> {
    await this.db
      .update(payoutAccounts)
      .set({ gatewayAccountId: mainAccountId, isMainAccount: true })
      .where(eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId));
  }

  // How many payout accounts pay out through a gateway config
  async countByConfig(paymentGatewayConfigId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(payoutAccounts)
      .where(eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigId));
    return Number(result?.value ?? 0);
  }

  private async selectDetailed(where: SQL): Promise<PayoutAccountDetail[]> {
    const rows = await this.db
      .select({
        row: payoutAccounts,
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
      .from(payoutAccounts)
      .innerJoin(paymentGatewayConfigs, eq(paymentGatewayConfigs.id, payoutAccounts.paymentGatewayConfigId))
      .innerJoin(bankAccounts, eq(bankAccounts.id, payoutAccounts.bankAccountId))
      .where(where)
      .orderBy(asc(payoutAccounts.createdAt));
    return rows.map(({ row, gateway, bank }) => ({ ...row, gateway, bank }));
  }
}
