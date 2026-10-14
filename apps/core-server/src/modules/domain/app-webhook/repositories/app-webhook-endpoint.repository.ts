import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { type AppWebhookEndpoint, appWebhookEndpoints } from '@/db/schema';

export interface AppWebhookEndpointValues {
  url: string;
  events: string[];
  isActive: boolean;
}

@Injectable()
export class AppWebhookEndpointDomainRepository extends PrimaryBaseRepository<typeof appWebhookEndpoints> {
  constructor(database: PrimaryDatabaseService) {
    super(database, appWebhookEndpoints);
  }

  // The app's endpoint, if it registered one
  async findByApp(organizationId: string, appId: string): Promise<AppWebhookEndpoint | undefined> {
    return this.model.findFirst({ where: { organizationId, appId } });
  }

  // Creates the app's endpoint or replaces its settings — one endpoint per app
  async upsert(organizationId: string, appId: string, values: AppWebhookEndpointValues): Promise<AppWebhookEndpoint> {
    const rows = (await this.db
      .insert(appWebhookEndpoints)
      .values({ organizationId, appId, ...values })
      .onConflictDoUpdate({
        target: appWebhookEndpoints.appId,
        set: { ...values, updatedAt: new Date() },
      })
      .returning()) as AppWebhookEndpoint[];
    return rows[0];
  }

  // Removes the app's endpoint; its deliveries cascade with it
  async deleteByApp(organizationId: string, appId: string): Promise<number> {
    const { count } = await this.deleteMany(
      and(eq(appWebhookEndpoints.organizationId, organizationId), eq(appWebhookEndpoints.appId, appId)) as SQL,
    );
    return count;
  }
}
