import { UserService } from '@domain/user/services/user.service';
import { UserPermissionsService } from '@domain/user-permissions/services/user-permissions.service';
import { Injectable } from '@nestjs/common';
import type { BuSelectResponseDto } from '../dto/response/bu-select-response.dto';

@Injectable()
export class UserPermissionsApiService {
  constructor(
    private readonly userService: UserService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

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
}
