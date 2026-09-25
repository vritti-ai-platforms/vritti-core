import { SiteGroupDomainModule } from '@domain/site-group/site-group.module';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@vritti/api-sdk/cache';
import { SiteGroupContextCacheService } from './site-group-context-cache.service';
import { SiteGroupContextResolverService } from './site-group-context-resolver.service';

@Global()
@Module({
  imports: [
    SiteGroupDomainModule,
    // Driver from validated config: lru = in-memory per-instance (default); redis = shared across instances
    CacheModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        driver: config.get<'lru' | 'redis'>('CACHE_DRIVER') ?? 'lru',
        lru: { max: 5000 },
      }),
    }),
  ],
  providers: [SiteGroupContextCacheService, SiteGroupContextResolverService],
  exports: [SiteGroupContextCacheService, SiteGroupContextResolverService],
})
export class SiteGroupContextModule {}
