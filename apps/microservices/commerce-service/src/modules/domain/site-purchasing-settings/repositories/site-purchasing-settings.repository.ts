import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { inArray } from '@vritti/api-sdk/drizzle-orm';
import { type SitePurchasingSettings, sitePurchasingSettings } from '@/db/schema';

export type SitePurchasingSettingsValues = Partial<
  Pick<SitePurchasingSettings, 'supplierItemsRequired' | 'updateSupplierItemsFromOrders'>
>;

@Injectable()
export class SitePurchasingSettingsDomainRepository extends PrimaryBaseRepository<typeof sitePurchasingSettings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, sitePurchasingSettings);
  }

  // Writes a site's rules, creating its row the first time the legal entity sets one
  async upsert(siteId: string, values: SitePurchasingSettingsValues): Promise<void> {
    await this.db
      .insert(sitePurchasingSettings)
      .values({ siteId, ...values })
      .onConflictDoUpdate({ target: sitePurchasingSettings.siteId, set: { ...values, updatedAt: new Date() } });
  }

  // Returns a site's rules, if the legal entity has set any
  findBySite(siteId: string): Promise<SitePurchasingSettings | undefined> {
    return this.model.findFirst({ where: { siteId } });
  }

  // Returns the rules of every one of the given sites the legal entity has set any for
  findBySites(siteIds: string[]): Promise<SitePurchasingSettings[]> {
    return this.findAllWithSelect<SitePurchasingSettings>({ where: inArray(sitePurchasingSettings.siteId, siteIds) });
  }
}
