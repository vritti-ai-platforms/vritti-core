import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { UserRoleAssignment } from '@/db/schema';
import { BusinessUnitService } from '@domain/business-unit/services/business-unit.service';
import { UserRoleService } from '@domain/user-role/services/user-role.service';
import type { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import type { CreateBusinessUnitWebhookDto } from '../dto/request/create-business-unit-webhook.dto';
import type { UpdateBuAppsWebhookDto } from '../dto/request/update-bu-apps-webhook.dto';
import type { UpdateBusinessUnitWebhookDto } from '../dto/request/update-business-unit-webhook.dto';

@Injectable()
export class BusinessUnitApiService {
  private readonly logger = new Logger(BusinessUnitApiService.name);

  constructor(
    private readonly businessUnitService: BusinessUnitService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // Creates a new business unit
  async create(orgId: string, dto: CreateBusinessUnitWebhookDto): Promise<BusinessUnitDto> {
    return this.businessUnitService.create(orgId, dto);
  }

  // Lists all business units for an organization
  async findByOrg(orgId: string): Promise<BusinessUnitDto[]> {
    return this.businessUnitService.findByOrg(orgId);
  }

  // Returns a business unit and its subtree
  async findSubtree(id: string): Promise<BusinessUnitDto[]> {
    return this.businessUnitService.findSubtree(id);
  }

  // Lists role assignments for a business unit
  async findRoleAssignments(
    buId: string,
  ): Promise<(UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[]> {
    return this.userRoleService.findByBusinessUnit(buId);
  }

  // Sets assigned apps for a business unit
  async updateApps(id: string, dto: UpdateBuAppsWebhookDto): Promise<SuccessResponseDto> {
    return this.businessUnitService.updateApps(id, dto);
  }

  // Updates a business unit
  async update(id: string, dto: UpdateBusinessUnitWebhookDto): Promise<SuccessResponseDto> {
    return this.businessUnitService.update(id, dto);
  }

  // Deletes a business unit
  async remove(id: string): Promise<SuccessResponseDto> {
    return this.businessUnitService.remove(id);
  }
}
