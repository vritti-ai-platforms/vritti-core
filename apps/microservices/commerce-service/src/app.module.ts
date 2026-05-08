import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema/relations';

import './db/schema.registry';

import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { validate } from './config/env.validation';
import { BomModule } from './modules/bom/bom.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConversionsModule } from './modules/conversions/conversions.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { CustomersModule } from './modules/customers/customers.module';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ItemsModule } from './modules/items/items.module';
import { ModifierGroupsModule } from './modules/modifier-groups/modifier-groups.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PriceListsModule } from './modules/price-lists/price-lists.module';
import { PosTerminalsModule } from './modules/pos-terminals/pos-terminals.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { StockAdjustmentsModule } from './modules/stock-adjustments/stock-adjustments.module';
import { StockTransfersModule } from './modules/stock-transfers/stock-transfers.module';
import { LocationsModule } from './modules/locations/locations.module';
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
          drizzleSchema: schema,
          drizzleRelations: relations,
          maxConnections: 20,
        };
        return options;
      },
    }),
    CategoriesModule,
    ItemsModule,
    ModifierGroupsModule,
    TaxGroupsModule,
    UomDimensionsModule,
    UomModule,
    InventoryItemsModule,
    BomModule,
    SuppliersModule,
    PurchaseOrdersModule,
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
