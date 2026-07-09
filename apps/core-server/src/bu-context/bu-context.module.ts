import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@vritti/api-sdk/cache';
import { BuContextCacheService } from './bu-context-cache.service';

@Global()
@Module({
  imports: [
    // Driver from validated config: lru = in-memory per-instance (default); redis = shared across instances
    CacheModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        driver: config.get<'lru' | 'redis'>('CACHE_DRIVER') ?? 'lru',
        lru: { max: 5000 },
      }),
    }),
  ],
  providers: [BuContextCacheService],
  exports: [BuContextCacheService],
})
export class BuContextModule {}
