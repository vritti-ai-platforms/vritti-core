import { Module } from '@nestjs/common';
import { AppDomainRepository } from './repositories/app.repository';
import { AppDomainService } from './services/app.service';

/**
 * Owns the app credential rows.
 *
 * `AppRequestResolver` (security) injects this service to resolve a client id and
 * stamp last-used when a signed request verifies. Nothing in api-sdk reaches in
 * here any more — the SDK asks core to resolve the credential rather than
 * borrowing a lookup port.
 */
@Module({
  providers: [AppDomainService, AppDomainRepository],
  exports: [AppDomainService, AppDomainRepository],
})
export class AppDomainModule {}
