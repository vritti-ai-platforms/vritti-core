import { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import { SiteDto } from '@domain/site/dto/entity/site.dto';
import { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import { ApiProperty } from '@nestjs/swagger';

export class StructureOrganizationDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  code: string;
}

export class StructureResponseDto {
  @ApiProperty({ type: StructureOrganizationDto })
  organization: StructureOrganizationDto;

  @ApiProperty({ type: [LegalEntityDto] })
  legalEntities: LegalEntityDto[];

  @ApiProperty({ type: [LeTaxRegistrationDto] })
  taxRegistrations: LeTaxRegistrationDto[];

  @ApiProperty({ type: [SiteGroupDto] })
  siteGroups: SiteGroupDto[];

  @ApiProperty({ type: [SiteDto] })
  sites: SiteDto[];

  // Creates an aggregate DTO from the organization and its structure lists
  static from(
    organization: { id: string; name: string; subdomain: string },
    legalEntities: LegalEntityDto[],
    taxRegistrations: LeTaxRegistrationDto[],
    siteGroups: SiteGroupDto[],
    sites: SiteDto[],
  ): StructureResponseDto {
    const dto = new StructureResponseDto();
    dto.organization = { id: organization.id, name: organization.name, code: organization.subdomain };
    dto.legalEntities = legalEntities;
    dto.taxRegistrations = taxRegistrations;
    dto.siteGroups = siteGroups;
    dto.sites = sites;
    return dto;
  }
}
