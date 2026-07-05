import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@vritti/api-sdk/cache';
import { UserPermissionsDomainModule } from '@/modules/domain/user-permissions/user-permissions.module';
import { PermissionInterceptor } from './interceptors/permission.interceptor';
import { PermissionSetCacheService } from './services/permission-set-cache.service';

// @RequirePermission is enforced by a global interceptor (not a guard) so it always runs after
// VrittiAuthGuard — interceptors execute after all guards, so request.sessionInfo is guaranteed populated.
@Global()
@Module({
  imports: [
    UserPermissionsDomainModule,
    // Driver from validated config: lru = in-memory per-instance (default); redis = shared across instances
    CacheModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        driver: config.get<'lru' | 'redis'>('CACHE_DRIVER') ?? 'lru',
        lru: { max: 5000 },
      }),
    }),
  ],
  providers: [PermissionSetCacheService, { provide: APP_INTERCEPTOR, useClass: PermissionInterceptor }],
  exports: [PermissionSetCacheService],
})
export class RbacModule {}
