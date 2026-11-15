import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@vritti/api-sdk/cache';
import { LegalEntityContextCacheService } from './legal-entity-context-cache.service';
import { LegalEntityContextResolverService } from './legal-entity-context-resolver.service';

@Global()
@Module({
  imports: [
    LegalEntityDomainModule,
    // Driver from validated config: lru = in-memory per-instance (default); redis = shared across instances
    CacheModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        driver: config.get<'lru' | 'redis'>('CACHE_DRIVER') ?? 'lru',
        lru: { max: 5000 },
      }),
    }),
  ],
  providers: [LegalEntityContextCacheService, LegalEntityContextResolverService],
  exports: [LegalEntityContextCacheService, LegalEntityContextResolverService],
})
export class LegalEntityContextModule {}
