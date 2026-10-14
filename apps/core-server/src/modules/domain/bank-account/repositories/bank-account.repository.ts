import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { count, desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type BankAccount, bankAccounts, paymentGatewayConfigs, paymentLinkedAccounts } from '@/db/schema';

@Injectable()
export class BankAccountDomainRepository extends PrimaryBaseRepository<typeof bankAccounts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, bankAccounts);
  }

  // Finds a page of bank accounts with its total, newest first unless the caller sorts
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: BankAccount[]; count: number }> {
    return this.findAllAndCount({
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(bankAccounts.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Finds a legal entity's bank accounts, newest first
  async findByLegalEntity(orgId: string, legalEntityId: string): Promise<BankAccount[]> {
    return this.model.findMany({
      where: { organizationId: orgId, legalEntityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Finds the account that already holds this number at this branch for the legal entity
  async findDuplicate(
    legalEntityId: string,
    accountNumber: string,
    ifscCode: string,
  ): Promise<BankAccount | undefined> {
    return this.model.findFirst({
      where: { legalEntityId, accountNumber, ifscCode },
    });
  }

  // Counts the gateway configs and linked accounts that settle into the bank account
  async countReferences(id: string): Promise<{ gatewayConfigs: number; linkedAccounts: number }> {
    const [[configs], [linked]] = await Promise.all([
      this.db.select({ value: count() }).from(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.bankAccountId, id)),
      this.db.select({ value: count() }).from(paymentLinkedAccounts).where(eq(paymentLinkedAccounts.bankAccountId, id)),
    ]);
    return { gatewayConfigs: Number(configs?.value ?? 0), linkedAccounts: Number(linked?.value ?? 0) };
  }
}
