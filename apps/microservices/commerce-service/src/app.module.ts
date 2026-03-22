import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema';

import './db/schema.registry';

import { type DatabaseModuleOptions, DatabaseModule } from '@vritti/api-sdk';
import { validate } from './config/env.validation';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // Database module (primary DB only)
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
          connectionCacheTTL: 300000,
          maxConnections: 10,
        };
        return options;
      },
    }),
    // Feature modules
    CatalogModule,
    OrdersModule,
    InvoicingModule,
  ],
})
export class AppModule {}
