import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, isNull, ne, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentGatewayConfig, paymentGatewayConfigs, payoutAccounts } from '@/db/schema';

export type PaymentGatewayConfigGroup = string | null;

export type PaymentGatewayConfigDetail = PaymentGatewayConfig & { payoutAccountCount: number };

@Injectable()
export class PaymentGatewayConfigDomainRepository extends PrimaryBaseRepository<typeof paymentGatewayConfigs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentGatewayConfigs);
  }

  // The config with how many payout accounts the caller can see under it, for a write's guard read
  private detailSelection() {
    return {
      ...getColumns(paymentGatewayConfigs),
      payoutAccountCount: this.db.$count(
        payoutAccounts,
        eq(payoutAccounts.paymentGatewayConfigId, paymentGatewayConfigs.id),
      ),
    };
  }

  // Returns every row RLS lets the caller see, newest first
  async findAll(): Promise<PaymentGatewayConfig[]> {
    return this.model.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // Returns one page of the rows the caller may see with the total, newest first unless the caller sorts
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

  // Returns one config with its payout account count
  async findDetailById(id: string): Promise<PaymentGatewayConfigDetail | undefined> {
    return this.findById<PaymentGatewayConfigDetail>(id, { select: this.detailSelection() });
  }

  // Reports whether the group already has a row for the gateway; an organization's own may share a code with Vritti's
  async findConflicts(
    group: PaymentGatewayConfigGroup,
    gatewayCode: string,
    excludeId?: string,
  ): Promise<{ gatewayCodeTaken: boolean }> {
    const gatewayCodeTaken = await this.exists(
      and(
        group === null ? isNull(paymentGatewayConfigs.organizationId) : eq(paymentGatewayConfigs.organizationId, group),
        eq(paymentGatewayConfigs.gatewayCode, gatewayCode),
        excludeId ? ne(paymentGatewayConfigs.id, excludeId) : undefined,
      ) as SQL,
    );
    return { gatewayCodeTaken };
  }
}
