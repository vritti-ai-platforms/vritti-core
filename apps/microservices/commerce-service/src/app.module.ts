import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk/database';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { relations } from '@/db/schema/relations';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { validate } from './config/env.validation';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CostCategoriesModule } from './modules/cost-categories/cost-categories.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { CustomersModule } from './modules/customers/customers.module';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { LocationsModule } from './modules/locations/locations.module';
import { LocationQuantsModule } from './modules/locations/quants/location-quants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PosTerminalsModule } from './modules/pos-terminals/pos-terminals.module';
import { PurchaseOrderItemsModule } from './modules/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SalesChannelsModule } from './modules/sales-channels/sales-channels.module';
import { StockAdjustmentsModule } from './modules/stock-adjustments/stock-adjustments.module';
import { StockTransfersModule } from './modules/stock-transfers/stock-transfers.module';
import { SupplierItemsModule } from './modules/supplier-items/supplier-items.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TaxGroupsModule } from './modules/tax-groups/tax-groups.module';
import { UomModule } from './modules/uom/uom.module';
import { UomDimensionsModule } from './modules/uom-dimensions/uom-dimensions.module';

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
            schema: config.get<string>('PRIMARY_DB_SCHEMA'),
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
    CategoriesModule,
    CostCategoriesModule,
    SalesChannelsModule,
    CatalogsModule,
    TaxGroupsModule,
    UomDimensionsModule,
    UomModule,
    InventoryItemsModule,
    SuppliersModule,
    SupplierItemsModule,
    PurchaseOrdersModule,
    PurchaseOrderItemsModule,
    GoodsReceiptsModule,
    LocationsModule,
    LocationQuantsModule,
    StockAdjustmentsModule,
    StockTransfersModule,
    InvoicesModule,
    PaymentsModule,
    PosTerminalsModule,
    CreditNotesModule,
    CustomersModule,
    OrdersModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
