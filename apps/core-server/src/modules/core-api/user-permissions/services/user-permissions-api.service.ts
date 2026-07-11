import { UserService } from '@domain/user/services/user.service';
import { UserPermissionsService } from '@domain/user-permissions/services/user-permissions.service';
import { Injectable } from '@nestjs/common';
import type { SiteSelectResponseDto } from '../dto/response/site-select-response.dto';

@Injectable()
export class UserPermissionsApiService {
  constructor(
    private readonly userService: UserService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  // Returns assigned sites in select dropdown format
  async getSitesSelect(userId: string): Promise<SiteSelectResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    const assignedSites = await this.userPermissionsService.getAssignedSites(userId, user.organizationId);
    return {
      options: assignedSites.map((site) => ({
        value: site.id,
        label: site.name,
        description: site.type,
      })),
      hasMore: false,
    };
  }
}
