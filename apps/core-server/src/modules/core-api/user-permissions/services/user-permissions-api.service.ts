import { UserDomainService } from '@domain/user/services/user.service';
import { UserPermissionsDomainService } from '@domain/user-permissions/services/user-permissions.service';
import { Injectable } from '@nestjs/common';
import type { SiteSelectResponseDto } from '../dto/response/site-select-response.dto';

@Injectable()
export class UserPermissionsService {
  constructor(
    private readonly userService: UserDomainService,
    private readonly userPermissionsService: UserPermissionsDomainService,
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
