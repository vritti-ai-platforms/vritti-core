import type { SitePurchasingSettingsDto } from '@domain/site-purchasing-settings/dto/entity/site-purchasing-settings.dto';
import { UpdateSitePurchasingSettingsDto } from '@domain/site-purchasing-settings/dto/request/update-site-purchasing-settings.dto';
import { SitePurchasingSettingsDomainService } from '@domain/site-purchasing-settings/services/site-purchasing-settings.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LePurchasesSettingsController {
  private readonly logger = new Logger(LePurchasesSettingsController.name);

  constructor(private readonly service: SitePurchasingSettingsDomainService) {}

  // Sets one of the legal entity's sites' purchasing rules
  @MessagePattern({ cmd: 'le.purchases.settings.update' })
  update(@Payload() dto: UpdateSitePurchasingSettingsDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.purchases.settings.update — siteId: ${dto.siteId}`);
    return this.service.update(dto);
  }

  // Returns the purchasing rules of each of the given sites, the defaults where none are set
  @MessagePattern({ cmd: 'le.purchases.settings.findForSites' })
  findForSites(@Payload() data: { siteIds: string[] }): Promise<SitePurchasingSettingsDto[]> {
    this.logger.log(`le.purchases.settings.findForSites — sites: ${data.siteIds.length}`);
    return this.service.findForSites(data.siteIds);
  }
}
