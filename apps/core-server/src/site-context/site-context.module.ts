import { SiteDomainModule } from '@domain/site/site.module';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@vritti/api-sdk/cache';
import { SiteContextCacheService } from './site-context-cache.service';
import { SiteContextResolverService } from './site-context-resolver.service';

@Global()
@Module({
  imports: [
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
  providers: [SiteContextCacheService, SiteContextResolverService],
  exports: [SiteContextCacheService, SiteContextResolverService],
})
export class SiteContextModule {}
