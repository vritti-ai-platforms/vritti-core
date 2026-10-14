import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, isNull, ne, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentGatewayConfig, type PaymentGatewayConfigType, paymentGatewayConfigs } from '@/db/schema';
import type { PaymentGatewayConfigContext } from '../payment-gateway-config-context';

@Injectable()
export class PaymentGatewayConfigDomainRepository extends PrimaryBaseRepository<typeof paymentGatewayConfigs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentGatewayConfigs);
  }

  // Finds a page of configs with its total, newest first unless the caller sorts
  async findForTable(params: {
    where: SQL | undefined;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: PaymentGatewayConfig[]; count: number }> {
    return this.findAllAndCount({
      where: params.where,
      orderBy: params.orderBy.length > 0 ? params.orderBy : [desc(paymentGatewayConfigs.createdAt)],
      limit: params.limit,
      offset: params.offset,
    });
  }

  // Finds a legal entity's configs, newest first
  async findByLegalEntity(orgId: string, legalEntityId: string): Promise<PaymentGatewayConfig[]> {
    return this.model.findMany({
      where: { organizationId: orgId, legalEntityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Finds the configs that settle into one bank account, newest first
  async findByBankAccount(orgId: string, bankAccountId: string): Promise<PaymentGatewayConfig[]> {
    return this.model.findMany({
      where: { organizationId: orgId, bankAccountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Finds the config already occupying a slot, whatever its gateway or bank account; a null site or app matches only
  // a null column, and excludeId skips the row being updated
  async findSlotOccupant(
    legalEntityId: string,
    type: PaymentGatewayConfigType,
    siteId: string | null,
    appId: string | null,
    excludeId?: string,
  ): Promise<PaymentGatewayConfig | undefined> {
    const [row] = await this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.legalEntityId, legalEntityId),
          eq(paymentGatewayConfigs.type, type),
          siteId ? eq(paymentGatewayConfigs.siteId, siteId) : isNull(paymentGatewayConfigs.siteId),
          appId ? eq(paymentGatewayConfigs.appId, appId) : isNull(paymentGatewayConfigs.appId),
          excludeId ? ne(paymentGatewayConfigs.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return row;
  }

  // Finds every config that could serve a context — the legal entity defaults plus any pinned to its site or
  // app — newest first, so the service's specificity ranking breaks ties deterministically
  async findCandidatesForContext(orgId: string, context: PaymentGatewayConfigContext): Promise<PaymentGatewayConfig[]> {
    const { siteId, appId } = context;
    return this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.organizationId, orgId),
          eq(paymentGatewayConfigs.legalEntityId, context.legalEntityId),
          eq(paymentGatewayConfigs.type, context.type),
          siteId
            ? or(isNull(paymentGatewayConfigs.siteId), eq(paymentGatewayConfigs.siteId, siteId))
            : isNull(paymentGatewayConfigs.siteId),
          appId
            ? or(isNull(paymentGatewayConfigs.appId), eq(paymentGatewayConfigs.appId, appId))
            : isNull(paymentGatewayConfigs.appId),
        ),
      )
      .orderBy(desc(paymentGatewayConfigs.createdAt));
  }
}
