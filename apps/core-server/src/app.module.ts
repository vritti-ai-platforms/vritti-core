import { isIP } from 'node:net';
import { join } from 'node:path';
import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import {
  AuthConfigModule,
  createGraphqlFormatError,
  DatabaseModule,
  type DatabaseModuleOptions,
  DataTableModule,
  getCorrelationContext,
  LoggerModule,
  RootModule,
  type TokenExpiryString,
  UnauthorizedException,
} from '@vritti/api-sdk';
import { EmailModule } from '@vritti/api-sdk/email';
import { NatsClientModule } from '@vritti/api-sdk/nats';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { BuContextModule } from '@/bu-context/bu-context.module';
import { BuContextCacheService } from '@/bu-context/bu-context-cache.service';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema';
import { RbacModule } from '@/rbac/rbac.module';
import { SecurityModule } from '@/security/security.module';
import { validate } from './config/env.validation';
import { AccountModule } from './modules/account/account.module';
import { CommerceGatewayModule } from './modules/commerce-gateway/commerce-gateway.module';
import { AuthApiModule } from './modules/core-api/auth/auth.module';
import { BusinessUnitApiModule } from './modules/core-api/business-unit/business-unit.module';
import { CatalogApiModule } from './modules/core-api/catalog/catalog.module';
import { OrganizationApiModule } from './modules/core-api/organization/organization.module';
import { UserApiModule } from './modules/core-api/user/user.module';
import { UserPermissionsApiModule } from './modules/core-api/user-permissions/user-permissions.module';
import { BusinessUnitDomainModule } from './modules/domain/business-unit/business-unit.module';
import { CatalogDomainModule } from './modules/domain/catalog/catalog.module';
import { OrganizationDomainModule } from './modules/domain/organization/organization.module';
import { SessionDomainModule } from './modules/domain/session/session.module';
import { UserDomainModule } from './modules/domain/user/user.module';
import { UserPermissionsDomainModule } from './modules/domain/user-permissions/user-permissions.module';
import { UserRoleDomainModule } from './modules/domain/user-role/user-role.module';
import { VerificationDomainModule } from './modules/domain/verification/verification.module';

@Module({
  imports: [
    // --- Infrastructure ---
    // Global environment config with schema validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // In-process event bus for real-time updates
    EventEmitterModule.forRoot(),
    // Structured application + HTTP request logging
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
            slowRequestThreshold: 3000,
          },
        };
      },
      inject: [ConfigService],
    }),
    // Apollo GraphQL transport (code-first schema on Fastify)
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      path: '/graphql',
      csrfPrevention: true,
      playground: false,
      introspection: process.env.NODE_ENV !== 'production',
      context: (request: FastifyRequest, reply: FastifyReply) => ({
        req: request,
        reply,
      }),
      formatError: createGraphqlFormatError({
        isProduction: process.env.NODE_ENV === 'production',
        getTraceId: () => getCorrelationContext()?.correlationId,
      }),
    }),
    // Drizzle/Postgres connection pool + RLS context hook
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
          maxConnections: 10,
          applyRlsContext: async (client, ctx) => {
            const r = ctx as { orgId: string };
            await client.query("SELECT set_config('app.org_id', $1, true)", [r.orgId]);
          },
        };
        return options;
      },
    }),
    // JWT auth + global VrittiAuthGuard (must load after DatabaseModule)
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
          csrfExemptSessionTypes: [schema.SessionTypeValues.MOBILE],
          refreshTokenBindingExemptSessionTypes: [schema.SessionTypeValues.MOBILE],
          csrfExemptTransports: ['graphql'],
          onAuthenticated: (requestService, sessionInfo) => {
            const hostname = requestService.getHostname();
            const allowRawIpHostRouting = config.get<boolean>('ALLOW_RAW_IP_HOST_ROUTING', false);

            if (allowRawIpHostRouting && isIP(hostname)) {
              const buHeader = requestService.getHeader('x-bu-id');
              const buId = Array.isArray(buHeader) ? buHeader[0] : buHeader;
              if (buId) {
                sessionInfo.buId = buId;
              }
              return;
            }

            const requestSubdomain = hostname.split('.')[0];
            if (!requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            if (sessionInfo.subdomain !== requestSubdomain) {
              throw new UnauthorizedException('Subdomain mismatch — token does not belong to this organization');
            }

            sessionInfo.subdomain = requestSubdomain;

            const buHeader = requestService.getHeader('x-bu-id');
            const buId = Array.isArray(buHeader) ? buHeader[0] : buHeader;
            if (buId) {
              sessionInfo.buId = buId;
            }
          },
        },
      }),
    }),

    // --- Cross-cutting SDK modules ---
    // Health check + CSRF endpoints
    RootModule,
    // Globally provided EmailService
    EmailModule,
    // Server-stored data table view state
    DataTableModule.forRoot({ tableViews: schema.tableViews }),
    // Permission-set cache + @RequirePermission guard
    RbacModule,
    // Cloud-signature guard + org-scope/RLS interceptors (global)
    SecurityModule,
    // Per-BU context cache (timezone, currency, hierarchy ids)
    BuContextModule,

    // --- Domain modules (services + repositories only) ---
    SessionDomainModule,
    VerificationDomainModule,
    BusinessUnitDomainModule,
    CatalogDomainModule,
    OrganizationDomainModule,
    UserDomainModule,
    UserRoleDomainModule,
    UserPermissionsDomainModule,

    // --- Messaging ---
    // NATS client (gateway mode) — resolves BU context from sessionInfo
    NatsClientModule.forRoot({
      imports: [BusinessUnitDomainModule],
      inject: [ConfigService, BusinessUnitRepository, BuContextCacheService],
      useFactory: (config: ConfigService, buRepo: BusinessUnitRepository, buContextCache: BuContextCacheService) => ({
        natsUrl: config.get<string>('NATS_URL'),
        services: [{ name: 'commerce' }],
        contextResolver: async (sessionInfo) => {
          const buId = sessionInfo.buId ?? '';
          const orgId = sessionInfo.organizationId ?? '';

          const cached = await buContextCache.get(buId);
          if (cached) {
            return { orgId, userId: sessionInfo.userId, buId, ...cached };
          }

          const bu = buId ? await buRepo.findById(buId) : null;
          const path = bu?.path ?? '';
          const [buAncestorIds, buDescendantIds] = path
            ? await Promise.all([buRepo.findAncestors(path), buRepo.findDescendants(path)])
            : [[buId], [buId]];
          const buTimezone = bu?.timezone ?? 'UTC';
          const buCurrencyCode = bu?.currencyCode ?? '';

          await buContextCache.set(buId, {
            buTimezone,
            buCurrencyCode,
            buAncestorIds,
            buDescendantIds,
          });
          return {
            orgId,
            userId: sessionInfo.userId,
            buId,
            buTimezone,
            buCurrencyCode,
            buAncestorIds,
            buDescendantIds,
          };
        },
      }),
    }),

    // --- API modules (controllers + DTOs + docs) ---
    AuthApiModule,
    UserApiModule,
    OrganizationApiModule,
    BusinessUnitApiModule,
    CatalogApiModule,
    UserPermissionsApiModule,
    // Profile and security management
    AccountModule,
    // Forwards requests to commerce-service via NATS
    CommerceGatewayModule,
    RouterModule.register([{ path: 'commerce-api', module: CommerceGatewayModule }]),
    RouterModule.register([{ path: 'account', module: AccountModule }]),
  ],
})
export class AppModule {}
