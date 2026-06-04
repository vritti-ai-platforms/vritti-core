import { Injectable, } from '@nestjs/common';
import { UserPermissionsService } from '@domain/user-permissions/services/user-permissions.service';
import { UserService } from '@domain/user/services/user.service';
import type { AssignedBuResponseDto } from '../dto/response/assigned-bu-response.dto';
import type { BuSelectResponseDto } from '../dto/response/bu-select-response.dto';
import type { PermissionsResponseDto } from '../dto/response/permissions-response.dto';

@Injectable()
export class UserPermissionsApiService {

  constructor(
    private readonly userService: UserService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  // Returns assigned business units for the user
  async getAssignedBusinessUnits(userId: string): Promise<AssignedBuResponseDto[]> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.userPermissionsService.getAssignedBusinessUnits(userId, user.organizationId);
  }

  // Returns assigned BUs in select dropdown format
  async getBusinessUnitsSelect(userId: string): Promise<BuSelectResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    const bus = await this.userPermissionsService.getAssignedBusinessUnits(userId, user.organizationId);
    return {
      options: bus.map((bu) => ({
        value: bu.id,
        label: bu.name,
        description: bu.type,
      })),
      hasMore: false,
    };
  }

  // Returns resolved features + MF config for the user at a specific BU
  async getPermissions(userId: string, buId: string): Promise<PermissionsResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.userPermissionsService.getPermissions(userId, buId, user.organizationId);
  }
}
