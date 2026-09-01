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
import { DB_SCHEMA } from '@/db/schema/core-schema';
import { MediaApiModule } from '@/modules/core-api/media/media-api.module';
import { RbacModule } from '@/rbac/rbac.module';
import { SecurityModule } from '@/security/security.module';
import { SiteContextModule } from '@/site-context/site-context.module';
import { SiteContextResolverService } from '@/site-context/site-context-resolver.service';
import { validate } from './config/env.validation';
import { AccountModule } from './modules/account/account.module';
import { CommerceAppGatewayModule } from './modules/commerce-gateway/commerce-app-gateway.module';
import { CommerceGatewayModule } from './modules/commerce-gateway/commerce-gateway.module';
import { CommunicationsAppGatewayModule } from './modules/communications-gateway/communications-app-gateway.module';
import { CommunicationsGatewayModule } from './modules/communications-gateway/communications-gateway.module';
import { CommunicationsInternalModule } from './modules/communications-gateway/internal/communications-internal.module';
import { WhatsappWebhookModule } from './modules/communications-gateway/webhooks/whatsapp-webhook.module';
import { AppApiModule } from './modules/core-api/app/app-api.module';
import { AuthApiModule } from './modules/core-api/auth/auth.module';
import { CatalogApiModule } from './modules/core-api/catalog/catalog.module';
import { OrganizationApiModule } from './modules/core-api/organization/organization.module';
import { StructureApiModule } from './modules/core-api/structure/structure.module';
import { UserApiModule } from './modules/core-api/user/user.module';
import { UserPermissionsApiModule } from './modules/core-api/user-permissions/user-permissions.module';
import { AppDomainModule } from './modules/domain/app/app.module';
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
import { GiteaGatewayModule } from './modules/gitea-gateway/gitea-gateway.module';
import { GiteaInternalModule } from './modules/gitea-gateway/internal/gitea-internal.module';
import { StorageInternalModule } from './modules/storage-internal/storage-internal.module';
import { AppRequestResolver } from './security/services/app-request.resolver';
import { CloudRequestResolver } from './security/services/cloud-request.resolver';

// Shared by both GraphQL registrations — only include/path/schema-file/introspection differ
const graphqlBaseOptions = {
  csrfPrevention: true,
  playground: false,
  context: (request: FastifyRequest, reply: FastifyReply) => ({ req: request, reply }),
  formatError: createGraphqlFormatError({
    isProduction: process.env.NODE_ENV === 'production',
    getTraceId: () => getCorrelationContext()?.correlationId,
  }),
};

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
    /**
     * Two Apollo transports, two schemas, one process.
     *
     * The storefront surface is a published product API, so it is introspectable in production
     * and must contain nothing internal. The mobile/web surface is not, and keeps introspection
     * off outside development.
     *
     * `forRootAsync` rather than `forRoot` deliberately: only the async form stamps a unique
     * `GRAPHQL_MODULE_ID`, which is what lets one dynamic module be registered twice. Each
     * registration builds its own `ApolloServer` and its own Fastify route, so they share no
     * state beyond the HTTP adapter.
     *
     * BOTH need an explicit `include` — omitting it means "scan every module", which would put
     * the storefront resolvers back into the internal schema. `include` also follows imports
     * transitively, so each listed module's closure must be free of the other surface's
     * resolvers. That is the whole reason the *AppGatewayModule surface modules exist.
     */
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      // `driver` belongs on this object, NOT in useFactory — assertDriver() reads the outer
      // options and throws before the factory ever runs.
      driver: ApolloDriver,
      useFactory: () => ({
        ...graphqlBaseOptions,
        include: [CommerceAppGatewayModule, CommunicationsAppGatewayModule],
        autoSchemaFile: join(process.cwd(), 'src/schema.app.gql'),
        path: '/graphql',
        // Public product surface: integrators codegen against it rather than reverse-engineering
        // from docs. Every type reachable from a storefront operation is therefore published API.
        introspection: true,
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: () => ({
        ...graphqlBaseOptions,
        include: [CommerceGatewayModule, StructureApiModule, AuthApiModule, AccountModule],
        autoSchemaFile: join(process.cwd(), 'src/schema.mobile.gql'),
        path: '/mobile-graphql',
        introspection: process.env.NODE_ENV !== 'production',
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
            schema: DB_SCHEMA,
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
      imports: [SecurityModule],
      inject: [ConfigService, AppRequestResolver, CloudRequestResolver],
      useFactory: (
        config: ConfigService,
        appRequestResolver: AppRequestResolver,
        cloudRequestResolver: CloudRequestResolver,
      ) => ({
        tokenExpiry: {
          access: config.getOrThrow('ACCESS_TOKEN_EXPIRY') as TokenExpiryString,
          refresh: config.getOrThrow('REFRESH_TOKEN_EXPIRY') as TokenExpiryString,
        },
        cookie: {
          refreshCookieName: config.get('REFRESH_COOKIE_NAME', 'vritti_core_refresh'),
          refreshCookieSecure: config.get('NODE_ENV') === 'production',
          refreshCookieSameSite: 'strict' as const,
          refreshCookieDomain: config.get('BASE_DOMAIN'),
        },

        guard: {
          csrfExemptSessionTypes: [schema.SessionTypeValues.MOBILE],
          refreshTokenBindingExemptSessionTypes: [schema.SessionTypeValues.MOBILE],
          csrfExemptTransports: ['graphql'],
          // Runs for BOTH callers. A session arrives already authenticated by the
          // guard and only needs its host checked; an app arrives unauthenticated
          // and is resolved here, because verifying its signature needs a database
          // lookup the SDK cannot do. Both then share the workspace-context headers.
          onAuthenticated: async (requestService, auth) => {
            // Reads context from the header, or the equivalent query param on SSE where headers can't be set
            const readContext = (name: string, param: string): string | undefined => {
              const value = requestService.getHeader(name);
              return (Array.isArray(value) ? value[0] : value) || requestService.getQueryParam(param);
            };

            // Workspace context: SITE > SITE_GROUP > LE; none = ORG workspace
            const applyContextHeaders = () => {
              const siteId = readContext('x-site-id', 'siteId');
              if (siteId) auth.siteId = siteId;
              const siteGroupId = readContext('x-sg-id', 'sgId');
              if (siteGroupId) auth.siteGroupId = siteGroupId;
              const legalEntityId = readContext('x-le-id', 'leId');
              if (legalEntityId) auth.legalEntityId = legalEntityId;
            };

            if (auth.kind === 'app') {
              // Fills organizationId, appId, appType and the credential's grants. No host
              // check: an app calls whatever hostname it was configured with, so the host
              // must not decide which tenant it speaks for.
              await appRequestResolver.resolve(requestService, auth);
              applyContextHeaders();
              return;
            }

            if (auth.kind === 'cloud') {
              // No workspace headers: the control plane names an organization, never a
              // workspace within it.
              cloudRequestResolver.resolve(requestService, auth);
              return;
            }

            // The org claim is a consistency check only — the org always derives from the session
            const orgIdHeader = readContext('x-org-id', 'orgId');
            if (orgIdHeader && orgIdHeader !== auth.organizationId) {
              throw new UnauthorizedException('Organization mismatch — header does not match this session');
            }

            const requestSubdomain = requestService.getHostname().split('.')[0];
            if (!requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            if (auth.subdomain !== requestSubdomain) {
              throw new UnauthorizedException('Invalid request host');
            }

            auth.subdomain = requestSubdomain;

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
    AppDomainModule,
    VerificationDomainModule,
    LegalEntityDomainModule,
    SiteDomainModule,
    SiteGroupDomainModule,
    CatalogDomainModule,
    OrganizationDomainModule,
    UserDomainModule,
    UserRoleDomainModule,
    UserPermissionsDomainModule,

    // NATS client (gateway mode) — resolves the workspace context from request.auth (site context derives its LE)
    NatsClientModule.forRoot({
      imports: [SiteContextModule],
      inject: [ConfigService, SiteContextResolverService],
      useFactory: (config: ConfigService, siteContextResolver: SiteContextResolverService) => ({
        natsUrl: config.get<string>('NATS_URL'),
        services: [{ name: 'commerce' }, { name: 'communications' }],
        contextResolver: async (request) => {
          const auth = request.auth;
          // A cloud-signed call without an organization IS the platform scope: the send goes out
          // with no RLS headers, the receiving service sets no GUCs, and its policies resolve only
          // the NULL-org (platform-owned) rows — e.g. platform SMS providers. Empty values are
          // omitted from the headers, so this context serializes to none at all.
          if (auth?.kind === 'cloud' && !auth.organizationId) {
            return {
              orgId: '',
              userId: '',
              siteId: '',
              legalEntityId: '',
              siteGroupId: '',
              siteTimezone: '',
              siteCurrencyCode: '',
            };
          }
          // For every other caller an organization is mandatory — without one the receiving
          // service would run with app.org_id unset, matching no rows rather than failing.
          if (!auth?.organizationId) return null;

          const orgId = auth.organizationId;

          // Who acted, per caller kind. A control-plane call has no principal at all, and
          // parseNatsHeaders now tolerates that rather than discarding the whole context.
          const userId = auth.kind === 'session' ? auth.userId : auth.kind === 'app' ? auth.appId : '';

          // A site workspace carries the full site context and derives its legal entity
          if (auth.siteId) {
            const siteContext = await siteContextResolver.resolve(auth.siteId);
            return {
              orgId,
              userId,
              siteId: auth.siteId,
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
            legalEntityId: auth.legalEntityId ?? '',
            siteGroupId: auth.siteGroupId ?? '',
            siteTimezone: '',
            siteCurrencyCode: '',
          };
        },
      }),
    }),

    // --- API modules (controllers + DTOs + docs) ---
    AppApiModule,
    AuthApiModule,
    // Public storefront surface — one signed mutation, tenant from the app's client id
    UserApiModule,
    OrganizationApiModule,
    StructureApiModule,
    CommerceAppGatewayModule,
    CommunicationsAppGatewayModule,
    CatalogApiModule,
    UserPermissionsApiModule,
    MediaApiModule,
    // Profile and security management
    AccountModule,
    // Forwards requests to commerce-service via NATS
    CommerceGatewayModule,
    // Forwards requests to communications-service via NATS
    CommunicationsGatewayModule,
    // Signed internal communications endpoints (OTP config options) — deliberately unprefixed so
    // their paths match the Ed25519-signed request path
    CommunicationsInternalModule,
    // Public Meta delivery callbacks — unprefixed so the path matches what is registered with Meta
    WhatsappWebhookModule,
    // Forwards requests to the self-hosted Gitea instance over HTTP
    GiteaGatewayModule,
    // Signed internal Gitea endpoint (pull-token) — deliberately unprefixed so its path matches the
    // Ed25519-signed request path; must NOT go under the gitea-api RouterModule prefix
    GiteaInternalModule,
    // Signed internal storage endpoint (org-storage) — deliberately unprefixed so its path matches the
    // Ed25519-signed request path, same as GiteaInternalModule
    StorageInternalModule,
    RouterModule.register([{ path: 'commerce-api', module: CommerceGatewayModule }]),
    RouterModule.register([{ path: 'communications-api', module: CommunicationsGatewayModule }]),
    RouterModule.register([{ path: 'gitea-api', module: GiteaGatewayModule }]),
    RouterModule.register([{ path: 'account', module: AccountModule }]),
  ],
})
export class AppModule {}
