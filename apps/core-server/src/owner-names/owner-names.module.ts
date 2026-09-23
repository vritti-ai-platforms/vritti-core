import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@vritti/api-sdk/cache';
import { OwnerNameService } from './owner-name.service';
import { OwnerNameCacheService } from './owner-name-cache.service';

// An owning organization, legal entity or site is a core concept, not a commerce one, so this sits
// above the gateways that read it. Global so the domain services that rename one can invalidate
// without importing upward from a gateway.
@Global()
@Module({
  imports: [
    OrganizationDomainModule,
    LegalEntityDomainModule,
    SiteDomainModule,
    // Driver from validated config: lru = in-memory per-instance (default); redis = shared across instances
    CacheModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        driver: config.get<'lru' | 'redis'>('CACHE_DRIVER') ?? 'lru',
        lru: { max: 5000 },
      }),
    }),
  ],
  providers: [OwnerNameCacheService, OwnerNameService],
  exports: [OwnerNameCacheService, OwnerNameService],
})
export class OwnerNamesModule {}
