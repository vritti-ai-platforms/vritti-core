import type { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import type { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import type { CreateLeTaxRegistrationInternalDto } from '@domain/legal-entity/dto/request/create-le-tax-registration-internal.dto';
import type { CreateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/create-legal-entity-internal.dto';
import type { UpdateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/update-legal-entity-internal.dto';
import { LegalEntityService } from '@domain/legal-entity/services/legal-entity.service';
import { OrganizationService } from '@domain/organization/services/organization.service';
import { SiteService } from '@domain/site/services/site.service';
import { SiteGroupService } from '@domain/site-group/services/site-group.service';
import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleService } from '@domain/user-role/services/user-role.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';
import { StructureResponseDto } from '../../dto/response/structure-response.dto';

@Injectable()
export class StructureApiService {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly legalEntityService: LegalEntityService,
    private readonly siteService: SiteService,
    private readonly siteGroupService: SiteGroupService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // Lists role assignments targeting a legal entity
  async findLegalEntityRoleAssignments(legalEntityId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleService.findByLegalEntity(legalEntityId);
  }

  // Returns the organization with its legal entities, tax registrations, site groups, and sites
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

  // Returns the legal entity's stored feature lock deny-list
  async getLegalEntityLocks(id: string): Promise<FeatureLocksResponseDto> {
    return { featureLocks: await this.legalEntityService.getFeatureLocks(id) };
  }

  // Replaces the legal entity's feature lock deny-list (null = inherit the full plan)
  async setLegalEntityLocks(id: string, dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    return this.legalEntityService.setFeatureLocks(id, dto.featureLocks ?? null);
  }

  // Creates a legal entity
  async createLegalEntity(dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    return this.legalEntityService.create(dto.orgId, dto);
  }

  // Updates a legal entity
  async updateLegalEntity(id: string, dto: UpdateLegalEntityInternalDto): Promise<SuccessResponseDto> {
    return this.legalEntityService.update(id, dto);
  }

  // Adds a tax registration to a legal entity
  async addRegistration(id: string, dto: CreateLeTaxRegistrationInternalDto): Promise<LeTaxRegistrationDto> {
    return this.legalEntityService.addRegistration(id, dto);
  }

  // Deletes a legal entity
  async deleteLegalEntity(id: string): Promise<SuccessResponseDto> {
    return this.legalEntityService.remove(id);
  }

  // Deletes a tax registration from a legal entity
  async deleteRegistration(id: string, regId: string): Promise<SuccessResponseDto> {
    return this.legalEntityService.removeRegistration(id, regId);
  }
}
