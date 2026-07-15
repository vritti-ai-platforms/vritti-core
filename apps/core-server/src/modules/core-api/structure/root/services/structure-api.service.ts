import { LegalEntityService } from '@domain/legal-entity/services/legal-entity.service';
import { OrganizationService } from '@domain/organization/services/organization.service';
import { SiteService } from '@domain/site/services/site.service';
import { SiteGroupService } from '@domain/site-group/services/site-group.service';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { StructureResponseDto } from '../../dto/response/structure-response.dto';

@Injectable()
export class StructureApiService {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly legalEntityService: LegalEntityService,
    private readonly siteService: SiteService,
    private readonly siteGroupService: SiteGroupService,
  ) {}

  // Returns the organization structure aggregate
  async getStructure(orgId: string): Promise<StructureResponseDto> {
    const organization = await this.organizationService.getById(orgId);
    if (!organization) throw new NotFoundException('Organization not found.');

    const [{ legalEntities, taxRegistrations }, siteGroups, sites] = await Promise.all([
      this.legalEntityService.listByOrg(orgId),
      this.siteGroupService.findByOrg(orgId),
      this.siteService.findByOrg(orgId),
    ]);

    return StructureResponseDto.from(organization, legalEntities, taxRegistrations, siteGroups, sites);
  }
}
