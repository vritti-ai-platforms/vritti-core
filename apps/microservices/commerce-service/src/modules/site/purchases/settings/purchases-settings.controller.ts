import type { SitePurchasingSettingsDto } from '@domain/site-purchasing-settings/dto/entity/site-purchasing-settings.dto';
import { SitePurchasingSettingsDomainService } from '@domain/site-purchasing-settings/services/site-purchasing-settings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';

@Controller()
export class PurchasesSettingsController {
  private readonly logger = new Logger(PurchasesSettingsController.name);

  constructor(private readonly service: SitePurchasingSettingsDomainService) {}

  // Returns the caller's site's purchasing rules, the defaults while none are set
  @MessagePattern({ cmd: 'site.purchases.settings.findForSite' })
  findForSite(@RpcNatsHeaders() headers: NatsHeaders): Promise<SitePurchasingSettingsDto> {
    this.logger.log('site.purchases.settings.findForSite');
    return this.service.findForSite(headers.siteId);
  }
}
