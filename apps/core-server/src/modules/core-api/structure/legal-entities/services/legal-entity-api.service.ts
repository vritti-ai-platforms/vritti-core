import type { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import type { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import type { CreateLeTaxRegistrationInternalDto } from '@domain/legal-entity/dto/request/create-le-tax-registration-internal.dto';
import type { CreateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/create-legal-entity-internal.dto';
import type { UpdateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/update-legal-entity-internal.dto';
import { LegalEntityDomainService } from '@domain/legal-entity/services/legal-entity.service';
import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleDomainService } from '@domain/user-role/services/user-role.service';
import { Injectable } from '@nestjs/common';
import type { SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { OrgStructureSelectQueryDto } from '../../dto/request/org-structure-select-query.dto';
import type { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import type { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';

@Injectable()
export class LegalEntityService {
  constructor(
    private readonly legalEntityService: LegalEntityDomainService,
    private readonly userRoleService: UserRoleDomainService,
  ) {}

  // Returns legal entities as select options with subtree exclusion
  findForSelect(query: OrgStructureSelectQueryDto): Promise<SelectQueryResult> {
    return this.legalEntityService.findForSelect(query, query.excludeId);
  }

  // Lists role assignments targeting a legal entity
  async findRoleAssignments(legalEntityId: string): Promise<AssignmentWithNames[]> {
    return this.userRoleService.findByLegalEntity(legalEntityId);
  }

  // Returns the legal entity's stored feature lock deny-list
  async getFeatureLocks(id: string): Promise<FeatureLocksResponseDto> {
    return { featureLocks: await this.legalEntityService.getFeatureLocks(id) };
  }

  // Replaces the legal entity's feature lock deny-list
  async setFeatureLocks(id: string, dto: SetFeatureLocksInternalDto): Promise<SuccessResponseDto> {
    return this.legalEntityService.setFeatureLocks(id, dto.featureLocks ?? null);
  }

  // Creates a legal entity
  async create(orgId: string, dto: CreateLegalEntityInternalDto): Promise<LegalEntityDto> {
    return this.legalEntityService.create(orgId, dto);
  }

  // Updates a legal entity
  async update(id: string, dto: UpdateLegalEntityInternalDto): Promise<SuccessResponseDto> {
    return this.legalEntityService.update(id, dto);
  }

  // Reorders a batch of sibling legal entities
  async reorder(orgId: string, ids: string[]): Promise<SuccessResponseDto> {
    return this.legalEntityService.reorder(orgId, ids);
  }

  // Adds a tax registration to a legal entity
  async addRegistration(id: string, dto: CreateLeTaxRegistrationInternalDto): Promise<LeTaxRegistrationDto> {
    return this.legalEntityService.addRegistration(id, dto);
  }

  // Deletes a legal entity
  async remove(id: string): Promise<SuccessResponseDto> {
    return this.legalEntityService.remove(id);
  }

  // Deletes a tax registration from a legal entity
  async deleteRegistration(id: string, regId: string): Promise<SuccessResponseDto> {
    return this.legalEntityService.removeRegistration(id, regId);
  }
}
