import { Module } from '@nestjs/common';
import { AppDomainRepository } from './repositories/app.repository';
import { AppDomainService } from './services/app.service';
import { AppStorefrontDomainService } from './services/app-storefront.service';

// Owns the app credential rows
@Module({
  providers: [AppDomainService, AppStorefrontDomainService, AppDomainRepository],
  exports: [AppDomainService, AppStorefrontDomainService, AppDomainRepository],
})
export class AppDomainModule {}
