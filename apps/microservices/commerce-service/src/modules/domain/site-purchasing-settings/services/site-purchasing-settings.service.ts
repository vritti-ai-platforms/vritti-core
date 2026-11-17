import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SitePurchasingSettingsDto } from '../dto/entity/site-purchasing-settings.dto';
import type { UpdateSitePurchasingSettingsDto } from '../dto/request/update-site-purchasing-settings.dto';
import { SitePurchasingSettingsDomainRepository } from '../repositories/site-purchasing-settings.repository';

@Injectable()
export class SitePurchasingSettingsDomainService {
  private readonly logger = new Logger(SitePurchasingSettingsDomainService.name);

  constructor(private readonly repository: SitePurchasingSettingsDomainRepository) {}

  // Sets a site's purchasing rules; an omitted rule is left as it is
  async update(dto: UpdateSitePurchasingSettingsDto): Promise<SuccessResponseDto> {
    const { siteId, ...values } = dto;
    await this.repository.upsert(siteId, values);
    this.logger.log(`Updated purchasing rules of site ${siteId}`);
    return { success: true, message: "The site's purchasing rules were updated." };
  }

  // Returns a site's purchasing rules, the defaults while none are set
  async findForSite(siteId: string): Promise<SitePurchasingSettingsDto> {
    const row = await this.repository.findBySite(siteId);
    return row ? SitePurchasingSettingsDto.from(row) : SitePurchasingSettingsDto.defaults(siteId);
  }

  // Returns the purchasing rules of each of the given sites, the defaults where none are set
  async findForSites(siteIds: string[]): Promise<SitePurchasingSettingsDto[]> {
    if (siteIds.length === 0) return [];
    const rows = new Map((await this.repository.findBySites(siteIds)).map((row) => [row.siteId, row]));
    return siteIds.map((siteId) => {
      const row = rows.get(siteId);
      return row ? SitePurchasingSettingsDto.from(row) : SitePurchasingSettingsDto.defaults(siteId);
    });
  }
}
