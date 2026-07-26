import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk/database';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { DB_SCHEMA } from '@/db/schema/commerce-schema';
import { relations } from '@/db/schema/relations';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { validate } from './config/env.validation';
import { LeCostCategoriesModule } from './modules/legal-entity/cost-categories/cost-categories.module';
import { LeSuppliersModule } from './modules/legal-entity/suppliers/suppliers.module';
import { LeTaxGroupsModule } from './modules/legal-entity/tax-groups/tax-groups.module';
import { OrgCategoriesModule } from './modules/organization/categories/categories.module';
import { OrgCompaniesModule } from './modules/organization/companies/companies.module';
import { OrgInventoryItemsModule } from './modules/organization/inventory-items/inventory-items.module';
import { OrgPeopleModule } from './modules/organization/people/people.module';
import { OrgSalesChannelsModule } from './modules/organization/sales-channels/sales-channels.module';
import { OrgTaxClassesModule } from './modules/organization/tax-classes/tax-classes.module';
import { OrgTaxComponentsModule } from './modules/organization/tax-components/tax-components.module';
import { OrgTaxJurisdictionsModule } from './modules/organization/tax-jurisdictions/tax-jurisdictions.module';
import { OrgUomModule } from './modules/organization/uom/uom.module';
import { SelectModule } from './modules/select/select.module';
import { SiteCatalogsModule } from './modules/site/catalogs/catalogs.module';
import { SiteCreditNotesModule } from './modules/site/credit-notes/credit-notes.module';
import { SiteCustomersModule } from './modules/site/customers/customers.module';
import { SiteGoodsReceiptsModule } from './modules/site/goods-receipts/goods-receipts.module';
import { SiteInventoryItemsModule } from './modules/site/inventory-items/inventory-items.module';
import { SiteInvoicesModule } from './modules/site/invoices/invoices.module';
import { SiteLocationsModule } from './modules/site/locations/locations.module';
import { SiteLocationQuantsModule } from './modules/site/locations/quants/location-quants.module';
import { SiteOrdersModule } from './modules/site/orders/orders.module';
import { SitePaymentsModule } from './modules/site/payments/payments.module';
import { SitePosTerminalsModule } from './modules/site/pos-terminals/pos-terminals.module';
import { SitePurchaseOrdersModule } from './modules/site/purchase-orders/purchase-orders.module';
import { SiteStockAdjustmentsModule } from './modules/site/stock-adjustments/stock-adjustments.module';
import { SiteStockTransfersModule } from './modules/site/stock-transfers/stock-transfers.module';
import { SiteSuppliersModule } from './modules/site/suppliers/suppliers.module';
import { SiteGroupInventoryItemsModule } from './modules/site-group/inventory-items/inventory-items.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    DatabaseModule.forServer({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options: DatabaseModuleOptions = {
          primaryDb: {
            host: config.getOrThrow<string>('PRIMARY_DB_HOST'),
            port: config.get<number>('PRIMARY_DB_PORT'),
            username: config.getOrThrow<string>('PRIMARY_DB_USERNAME'),
            password: config.getOrThrow<string>('PRIMARY_DB_PASSWORD'),
            database: config.getOrThrow<string>('PRIMARY_DB_DATABASE'),
            schema: DB_SCHEMA,
            sslMode: config.get<'require' | 'prefer' | 'disable' | 'no-verify'>('PRIMARY_DB_SSL_MODE'),
          },
          drizzleRelations: relations,
          maxConnections: 20,
          applyRlsContext: async (client, ctx) => {
            const r = ctx as NatsHeaders;
            // Only set the GUCs the workspace context carries — unset GUCs read as NULL in policies instead of failing uuid casts
            const parts = ["set_config('app.org_id', $1, true)"];
            const values: string[] = [r.orgId];
            if (r.siteId) {
              parts.push(`set_config('app.site_id', $${values.length + 1}, true)`);
              values.push(r.siteId);
              parts.push(`set_config('app.site_timezone', $${values.length + 1}, true)`);
              values.push(r.siteTimezone);
            }
            if (r.legalEntityId) {
              parts.push(`set_config('app.le_id', $${values.length + 1}, true)`);
              values.push(r.legalEntityId);
            }
            if (r.siteGroupId) {
              parts.push(`set_config('app.site_group_id', $${values.length + 1}, true)`);
              values.push(r.siteGroupId);
            }
            await client.query(`SELECT ${parts.join(', ')}`, values);
          },
        };
        return options;
      },
    }),
    OrgCategoriesModule,
    OrgPeopleModule,
    OrgCompaniesModule,
    OrgSalesChannelsModule,
    OrgTaxClassesModule,
    OrgTaxComponentsModule,
    OrgTaxJurisdictionsModule,
    OrgUomModule,
    OrgInventoryItemsModule,
    LeCostCategoriesModule,
    LeTaxGroupsModule,
    LeSuppliersModule,
    SiteCatalogsModule,
    SiteInventoryItemsModule,
    SiteGroupInventoryItemsModule,
    SitePurchaseOrdersModule,
    SiteGoodsReceiptsModule,
    SiteLocationsModule,
    SiteLocationQuantsModule,
    SiteStockAdjustmentsModule,
    SiteStockTransfersModule,
    SiteInvoicesModule,
    SitePaymentsModule,
    SitePosTerminalsModule,
    SiteCreditNotesModule,
    SiteCustomersModule,
    SiteOrdersModule,
    SiteSuppliersModule,
    SelectModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
