import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, lte, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type BankAccount,
  bankAccounts,
  type PaymentLinkedAccount,
  PaymentLinkedAccountStatusValues,
  paymentGatewayConfigs,
  paymentLinkedAccounts,
} from '@/db/schema';

export interface PaymentLinkedAccountWithScope {
  account: PaymentLinkedAccount;
  collectorLegalEntityId: string;
  recipientLegalEntityId: string;
}

@Injectable()
export class PaymentLinkedAccountDomainRepository extends PrimaryBaseRepository<typeof paymentLinkedAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentLinkedAccounts);
  }

  // Finds a collector's linked accounts with the legal entities on both sides, newest first
  async findByCollector(orgId: string, collectorConfigId: string): Promise<PaymentLinkedAccountWithScope[]> {
    return this.selectWithScope(
      and(
        eq(paymentLinkedAccounts.organizationId, orgId),
        eq(paymentLinkedAccounts.collectorConfigId, collectorConfigId),
      ),
    );
  }

  // Finds one linked account with the legal entities on both sides
  async findWithScopeById(id: string): Promise<PaymentLinkedAccountWithScope | undefined> {
    const [row] = await this.selectWithScope(eq(paymentLinkedAccounts.id, id));
    return row;
  }

  // Finds the linked account a collector already holds for a bank account
  async findByCollectorAndBankAccount(
    collectorConfigId: string,
    bankAccountId: string,
  ): Promise<PaymentLinkedAccount | undefined> {
    return this.model.findFirst({
      where: { collectorConfigId, bankAccountId },
    });
  }

  // Finds the linked account a collector can transfer to right now for a bank account
  async findTransferable(
    orgId: string,
    collectorConfigId: string,
    bankAccountId: string,
    now: Date,
  ): Promise<PaymentLinkedAccount | undefined> {
    const [row] = await this.db
      .select()
      .from(paymentLinkedAccounts)
      .where(
        and(
          eq(paymentLinkedAccounts.organizationId, orgId),
          eq(paymentLinkedAccounts.collectorConfigId, collectorConfigId),
          eq(paymentLinkedAccounts.bankAccountId, bankAccountId),
          eq(paymentLinkedAccounts.status, PaymentLinkedAccountStatusValues.ACTIVE),
          lte(paymentLinkedAccounts.transfersAllowedAt, now),
        ),
      )
      .limit(1);
    return row;
  }

  // Finds a bank account of the organization, whichever legal entity holds it
  async findBankAccountInOrg(orgId: string, bankAccountId: string): Promise<BankAccount | undefined> {
    const [row] = await this.db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId)))
      .limit(1);
    return row;
  }

  // Selects linked accounts joined to their collector config and bank account for the legal entity on each side
  private async selectWithScope(where: SQL | undefined): Promise<PaymentLinkedAccountWithScope[]> {
    return this.db
      .select({
        account: paymentLinkedAccounts,
        collectorLegalEntityId: paymentGatewayConfigs.legalEntityId,
        recipientLegalEntityId: bankAccounts.legalEntityId,
      })
      .from(paymentLinkedAccounts)
      .innerJoin(paymentGatewayConfigs, eq(paymentGatewayConfigs.id, paymentLinkedAccounts.collectorConfigId))
      .innerJoin(bankAccounts, eq(bankAccounts.id, paymentLinkedAccounts.bankAccountId))
      .where(where)
      .orderBy(desc(paymentLinkedAccounts.createdAt));
  }
}
