import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule, type DatabaseModuleOptions, type NatsHeaders } from '@vritti/api-sdk';
import { relations } from '@/db/schema/relations';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { validate } from './config/env.validation';
import { BomModule } from './modules/bom/bom.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConversionsModule } from './modules/conversions/conversions.module';
import { CostCategoriesModule } from './modules/cost-categories/cost-categories.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { CustomersModule } from './modules/customers/customers.module';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { InventoryItemCostsModule } from './modules/inventory-item-costs/inventory-item-costs.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ItemsModule } from './modules/items/items.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ModifierGroupsModule } from './modules/modifier-groups/modifier-groups.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PosTerminalsModule } from './modules/pos-terminals/pos-terminals.module';
import { PriceListsModule } from './modules/price-lists/price-lists.module';
import { PurchaseOrderItemsModule } from './modules/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
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
            await client.query(
              "SELECT set_config('app.org_id', $1, true), set_config('app.bu_id', $2, true), set_config('app.bu_timezone', $3, true), set_config('app.bu_ancestor_ids', $4, true), set_config('app.bu_descendant_ids', $5, true)",
              [r.orgId, r.buId, r.buTimezone, `{${r.buAncestorIds.join(',')}}`, `{${r.buDescendantIds.join(',')}}`],
            );
          },
        };
        return options;
      },
    }),
    CategoriesModule,
    CostCategoriesModule,
    InventoryItemCostsModule,
    ItemsModule,
    ModifierGroupsModule,
    TaxGroupsModule,
    UomDimensionsModule,
    UomModule,
    InventoryItemsModule,
    BomModule,
    SuppliersModule,
    SupplierItemsModule,
    PurchaseOrdersModule,
    PurchaseOrderItemsModule,
    GoodsReceiptsModule,
    LocationsModule,
    ConversionsModule,
    StockAdjustmentsModule,
    StockTransfersModule,
    InvoicesModule,
    PaymentsModule,
    PriceListsModule,
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
