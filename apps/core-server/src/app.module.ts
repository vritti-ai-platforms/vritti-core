import { join } from 'node:path';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthConfigModule, type TokenExpiryString } from '@vritti/api-sdk/auth';
import { DataTableModule } from '@vritti/api-sdk/data-table';
import { DatabaseModule, type DatabaseModuleOptions } from '@vritti/api-sdk/database';
import { EmailModule } from '@vritti/api-sdk/email';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { createGraphqlFormatError } from '@vritti/api-sdk/filters';
import { getCorrelationContext, LoggerModule } from '@vritti/api-sdk/logger';
import { NatsClientModule } from '@vritti/api-sdk/nats';
import { RootModule } from '@vritti/api-sdk/root';
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema';
import { RbacModule } from '@/rbac/rbac.module';
import { SecurityModule } from '@/security/security.module';
import { SiteContextModule } from '@/site-context/site-context.module';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { validate } from './config/env.validation';
import { AccountModule } from './modules/account/account.module';
import { CommerceGatewayModule } from './modules/commerce-gateway/commerce-gateway.module';
import { AuthApiModule } from './modules/core-api/auth/auth.module';
import { CatalogApiModule } from './modules/core-api/catalog/catalog.module';
import { OrganizationApiModule } from './modules/core-api/organization/organization.module';
import { StructureApiModule } from './modules/core-api/structure/structure.module';
import { UserApiModule } from './modules/core-api/user/user.module';
import { UserPermissionsApiModule } from './modules/core-api/user-permissions/user-permissions.module';
import { CatalogDomainModule } from './modules/domain/catalog/catalog.module';
import { LegalEntityDomainModule } from './modules/domain/legal-entity/legal-entity.module';
import { OrganizationDomainModule } from './modules/domain/organization/organization.module';
import { SessionDomainModule } from './modules/domain/session/session.module';
import { SiteDomainModule } from './modules/domain/site/site.module';
import { SiteGroupDomainModule } from './modules/domain/site-group/site-group.module';
import { UserDomainModule } from './modules/domain/user/user.module';
import { UserPermissionsDomainModule } from './modules/domain/user-permissions/user-permissions.module';
import { UserRoleDomainModule } from './modules/domain/user-role/user-role.module';
import { VerificationDomainModule } from './modules/domain/verification/verification.module';
import { SelectApiModule } from './modules/select-api/select-api.module';

@Module({
  imports: [
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
            // Narrow-context vars are empty when absent — RLS policies read them via nullif(..., '')
            const r = ctx as { orgId?: string; siteId?: string; siteGroupId?: string; legalEntityId?: string };
            await client.query(
              "SELECT set_config('app.org_id', $1, true), set_config('app.site_id', $2, true), set_config('app.site_group_id', $3, true), set_config('app.le_id', $4, true)",
              [r.orgId ?? '', r.siteId ?? '', r.siteGroupId ?? '', r.legalEntityId ?? ''],
            );
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

            const readHeader = (name: string): string | undefined => {
              const value = requestService.getHeader(name);
              return Array.isArray(value) ? value[0] : value;
            };

            // x-org-id is a consistency check only — the org always derives from the session
            const orgIdHeader = readHeader('x-org-id');
            if (orgIdHeader && orgIdHeader !== sessionInfo.organizationId) {
              throw new UnauthorizedException('Organization mismatch — header does not match this session');
            }

            // Workspace context headers: SITE > SITE_GROUP > LE; none = ORG workspace
            const applyContextHeaders = () => {
              const siteId = readHeader('x-site-id');
              if (siteId) sessionInfo.siteId = siteId;
              const siteGroupId = readHeader('x-sg-id');
              if (siteGroupId) sessionInfo.siteGroupId = siteGroupId;
              const legalEntityId = readHeader('x-le-id');
              if (legalEntityId) sessionInfo.legalEntityId = legalEntityId;
            };

            const requestSubdomain = hostname.split('.')[0];
            if (!requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            if (sessionInfo.subdomain !== requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            sessionInfo.subdomain = requestSubdomain;

            applyContextHeaders();
          },
        },
      }),
    }),

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
    // Per-site context cache (timezone, currency, group chain)
    SiteContextModule,

    // --- Domain modules (services + repositories only) ---
    SessionDomainModule,
    VerificationDomainModule,
    LegalEntityDomainModule,
    SiteDomainModule,
    SiteGroupDomainModule,
    CatalogDomainModule,
    OrganizationDomainModule,
    UserDomainModule,
    UserRoleDomainModule,
    UserPermissionsDomainModule,

    // NATS client (gateway mode) — resolves the workspace context from sessionInfo (site context derives its LE)
    NatsClientModule.forRoot({
      imports: [SiteContextModule],
      inject: [ConfigService, SiteContextResolverService],
      useFactory: (config: ConfigService, siteContextResolver: SiteContextResolverService) => ({
        natsUrl: config.get<string>('NATS_URL'),
        services: [{ name: 'commerce' }],
        contextResolver: async (sessionInfo) => {
          const orgId = sessionInfo.organizationId;
          const userId = sessionInfo.userId;

          // A site workspace carries the full site context and derives its legal entity
          if (sessionInfo.siteId) {
            const siteContext = await siteContextResolver.resolve(sessionInfo.siteId);
            return {
              orgId,
              userId,
              siteId: sessionInfo.siteId,
              legalEntityId: siteContext.legalEntityId,
              siteGroupId: '',
              siteTimezone: siteContext.siteTimezone,
              siteCurrencyCode: siteContext.siteCurrencyCode,
            };
          }

          // Group / LE / org workspaces pass their own context through; empty values are omitted from the headers
          return {
            orgId,
            userId,
            siteId: '',
            legalEntityId: sessionInfo.legalEntityId ?? '',
            siteGroupId: sessionInfo.siteGroupId ?? '',
            siteTimezone: '',
            siteCurrencyCode: '',
          };
        },
      }),
    }),

    // --- API modules (controllers + DTOs + docs) ---
    AuthApiModule,
    UserApiModule,
    OrganizationApiModule,
    StructureApiModule,
    CatalogApiModule,
    UserPermissionsApiModule,
    // Profile and security management
    AccountModule,
    // Forwards requests to commerce-service via NATS
    CommerceGatewayModule,
    RouterModule.register([{ path: 'commerce-api', module: CommerceGatewayModule }]),
    // Cross-feature select/picker endpoints (not feature-gated)
    SelectApiModule,
    RouterModule.register([{ path: 'commerce-api', module: SelectApiModule }]),
    RouterModule.register([{ path: 'account', module: AccountModule }]),
  ],
})
export class AppModule {}
