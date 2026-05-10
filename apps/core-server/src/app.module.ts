import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema';

import './db/schema.registry';

import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import {
  AuthConfigModule,
  DatabaseModule,
  type DatabaseModuleOptions,
  DataTableModule,
  EmailModule,
  LoggerModule,
  NatsClientModule,
  RootModule,
  type TokenExpiryString,
  UnauthorizedException,
} from '@vritti/api-sdk';
import { validate } from './config/env.validation';
import { AccountModule } from './modules/account/account.module';
import { CommerceGatewayModule } from './modules/commerce-gateway/commerce-gateway.module';
import { AuthApiModule } from './modules/core-api/auth/auth.module';
import { BusinessUnitApiModule } from './modules/core-api/business-unit/business-unit.module';
import { ConfigApiModule } from './modules/core-api/config/config-api.module';
import { OrganizationApiModule } from './modules/core-api/organization/organization.module';
import { UserApiModule } from './modules/core-api/user/user.module';
import { UserPermissionsApiModule } from './modules/core-api/user-permissions/user-permissions.module';
import { BusinessUnitDomainModule } from './modules/domain/business-unit/business-unit.module';
import { ConfigCacheDomainModule } from './modules/domain/config-cache/config-cache.module';
import { OrganizationDomainModule } from './modules/domain/organization/organization.module';
import { SessionDomainModule } from './modules/domain/session/session.module';
import { UserDomainModule } from './modules/domain/user/user.module';
import { UserPermissionsDomainModule } from './modules/domain/user-permissions/user-permissions.module';
import { UserRoleDomainModule } from './modules/domain/user-role/user-role.module';
import { VerificationDomainModule } from './modules/domain/verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // Event emitter for real-time updates
    EventEmitterModule.forRoot(),
    // Logger module
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          environment: configService.getOrThrow('NODE_ENV'),
          appName: configService.getOrThrow('APP_NAME'),
          provider: configService.getOrThrow('LOG_PROVIDER'),
          level: configService.getOrThrow('LOG_LEVEL'),
          format: configService.getOrThrow('LOG_FORMAT'),
          enableFileLogger: configService.getOrThrow('LOG_TO_FILE'),
          filePath: configService.getOrThrow('LOG_FILE_PATH'),
          maxFiles: configService.getOrThrow('LOG_MAX_FILES'),

          enableHttpLogger: true,
          httpLogger: {
            enableRequestLog: true,
            enableResponseLog: true,
            slowRequestThreshold: 3000, // milliseconds
          },
        };
      },
      inject: [ConfigService],
    }),
    // Database module
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
          // Relations must be passed separately for db.query to work (drizzle-orm v2)
          drizzleRelations: relations,

          // Connection pool configuration
          maxConnections: 10,

          // Used by the webhook path (WebhookSessionInterceptor) — sets app.org_id for RLS.
          // Other HTTP routes don't stash an RLS context, so this is a no-op for them.
          applyRlsContext: async (client, ctx) => {
            const r = ctx as { orgId: string };
            await client.query("SELECT set_config('app.org_id', $1, true)", [r.orgId]);
          },
        };
        return options;
      },
    }),
    // Authentication module (Global guard + JWT)
    // Must be imported after DatabaseModule since VrittiAuthGuard depends on its services
    AuthConfigModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        tokenExpiry: {
          access: config.getOrThrow('ACCESS_TOKEN_EXPIRY') as TokenExpiryString,
          refresh: config.getOrThrow('REFRESH_TOKEN_EXPIRY') as TokenExpiryString,
        },
        cookie: {
          refreshCookieName: config.get('REFRESH_COOKIE_NAME', 'vritti_core_refresh'),
          refreshCookieSecure: config.get('NODE_ENV') === 'production',
          refreshCookieSameSite: 'strict' as const,
          refreshCookieDomain: config.get('REFRESH_COOKIE_DOMAIN'),
        },
        guard: {
          onAuthenticated: (requestService, sessionInfo) => {
            // Extract subdomain from request host
            const hostname = requestService.getHostname();
            const requestSubdomain = hostname.split('.')[0];
            if (!requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            // Validate request subdomain matches the token's subdomain (skip for old tokens without subdomain)
            if (sessionInfo.subdomain !== requestSubdomain) {
              throw new UnauthorizedException('Subdomain mismatch — token does not belong to this organization');
            }

            // Set subdomain on sessionInfo
            sessionInfo.subdomain = requestSubdomain;

            // Extract BU ID from header
            const buHeader = requestService.getHeader('x-bu-id');
            const buId = Array.isArray(buHeader) ? buHeader[0] : buHeader;
            if (buId) {
              sessionInfo.buId = buId;
            }
          },
        },
      }),
    }),
    // Root module — health check and CSRF endpoints
    RootModule,
    // Email module — globally provided EmailService
    EmailModule,
    // Data table views — server-stored table state
    DataTableModule.forRoot({ tableViews: schema.tableViews }),
    // Domain modules — services + repositories only
    ConfigCacheDomainModule,
    SessionDomainModule,
    VerificationDomainModule,
    BusinessUnitDomainModule,
    OrganizationDomainModule,
    UserDomainModule,
    UserRoleDomainModule,
    UserPermissionsDomainModule,
    // NATS client — gateway mode, resolves BU context from sessionInfo
    NatsClientModule.forRoot({
      imports: [BusinessUnitDomainModule],
      inject: [ConfigService, BusinessUnitRepository],
      useFactory: (config: ConfigService, buRepo: BusinessUnitRepository) => ({
        natsUrl: config.get<string>('NATS_URL'),
        services: [{ name: 'commerce' }],
        contextResolver: async (sessionInfo) => {
          const buId = sessionInfo.buId ?? '';
          const orgId = sessionInfo.organizationId ?? '';
          const bu = buId ? await buRepo.findById(buId) : null;
          const path = bu?.path ?? '';
          const [buAncestorIds, buDescendantIds] = path
            ? await Promise.all([buRepo.findAncestors(path), buRepo.findDescendants(path)])
            : [[buId], [buId]];
          const buTimezone = bu?.timezone ?? 'UTC';
          return { orgId, userId: sessionInfo.userId, buId, buTimezone, buAncestorIds, buDescendantIds };
        },
      }),
    }),
    // API modules — controllers + DTOs + docs
    AuthApiModule,
    ConfigApiModule,
    UserApiModule,
    OrganizationApiModule,
    BusinessUnitApiModule,
    UserPermissionsApiModule,
    // Account module — profile and security management
    AccountModule,
    // Commerce gateway — forwards requests to commerce-service via NATS
    CommerceGatewayModule,
    RouterModule.register([{ path: 'commerce-api', module: CommerceGatewayModule }]),
    RouterModule.register([{ path: 'account', module: AccountModule }]),
  ],
})
export class AppModule {}
