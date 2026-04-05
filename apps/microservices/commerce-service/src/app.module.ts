import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema/relations';

import './db/schema.registry';

import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk';
import { validate } from './config/env.validation';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './modules/items/items.module';
import { ModifierGroupsModule } from './modules/modifier-groups/modifier-groups.module';
import { TaxGroupsModule } from './modules/tax-groups/tax-groups.module';

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
          maxConnections: 10,
        };
        return options;
      },
    }),
    CategoriesModule,
    ItemsModule,
    ModifierGroupsModule,
    TaxGroupsModule,
  ],
})
export class AppModule {}
