import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk/database';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { DB_SCHEMA } from '@/db/schema/communications-schema';
import { relations } from '@/db/schema/relations';
import { RlsInterceptor } from './common/interceptors/rls.interceptor';
import { validate } from './config/env.validation';
import { OrgSmsOtpsModule } from './modules/organization/sms-otps/sms-otps.module';
import { OrgSmsProvidersModule } from './modules/organization/sms-providers/sms-providers.module';
import { OrgWhatsappAccountsModule } from './modules/organization/whatsapp-accounts/whatsapp-accounts.module';
import { OrgWhatsappOtpsModule } from './modules/organization/whatsapp-otps/whatsapp-otps.module';

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
          maxConnections: 10,
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
    OrgSmsOtpsModule,
    OrgSmsProvidersModule,
    OrgWhatsappAccountsModule,
    OrgWhatsappOtpsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
