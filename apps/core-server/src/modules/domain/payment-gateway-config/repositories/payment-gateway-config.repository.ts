import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, isNull, ne, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type PaymentGatewayConfig, PaymentGatewayConfigKindValues, paymentGatewayConfigs } from '@/db/schema';

// The group a row belongs to: an organization's own rows, or the platform rows (no organization)
export type PaymentGatewayConfigGroup = string | null;

@Injectable()
export class PaymentGatewayConfigDomainRepository extends PrimaryBaseRepository<typeof paymentGatewayConfigs> {
  constructor(database: PrimaryDatabaseService) {
    super(database, paymentGatewayConfigs);
  }

  // Finds a group's rows, newest first
  async findGroup(group: PaymentGatewayConfigGroup): Promise<PaymentGatewayConfig[]> {
    return this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(groupWhere(group))
      .orderBy(desc(paymentGatewayConfigs.createdAt));
  }

  // Finds the row that already holds a label in the group, skipping the row being updated
  async findByLabel(
    group: PaymentGatewayConfigGroup,
    label: string,
    excludeId?: string,
  ): Promise<PaymentGatewayConfig | undefined> {
    const [row] = await this.db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          groupWhere(group),
          eq(paymentGatewayConfigs.label, label),
          excludeId ? ne(paymentGatewayConfigs.id, excludeId) : undefined,
        ),
      )
      .limit(1);
    return row;
  }
}

// An organization's own rows, or the platform rows
function groupWhere(group: PaymentGatewayConfigGroup): SQL | undefined {
  return group === null
    ? and(
        isNull(paymentGatewayConfigs.organizationId),
        eq(paymentGatewayConfigs.kind, PaymentGatewayConfigKindValues.PLATFORM),
      )
    : and(
        eq(paymentGatewayConfigs.organizationId, group),
        eq(paymentGatewayConfigs.kind, PaymentGatewayConfigKindValues.ORG),
      );
}
