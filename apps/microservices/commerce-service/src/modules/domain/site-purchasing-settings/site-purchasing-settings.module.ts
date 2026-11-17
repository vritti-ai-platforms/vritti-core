import { Module } from '@nestjs/common';
import { SitePurchasingSettingsDomainRepository } from './repositories/site-purchasing-settings.repository';
import { SitePurchasingSettingsDomainService } from './services/site-purchasing-settings.service';

@Module({
  providers: [SitePurchasingSettingsDomainService, SitePurchasingSettingsDomainRepository],
  exports: [SitePurchasingSettingsDomainService],
})
export class SitePurchasingSettingsDomainModule {}
