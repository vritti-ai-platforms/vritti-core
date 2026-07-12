import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from '@vritti/api-sdk/auth';
import type { SiteSelectResponseDto } from '../dto/response/site-select-response.dto';
import { UserPermissionsApiService } from '../services/user-permissions-api.service';

@ApiTags('User Permissions')
@ApiBearerAuth()
@Controller('user-permissions')
export class UserPermissionsController {
  private readonly logger = new Logger(UserPermissionsController.name);

  constructor(private readonly userPermissionsApiService: UserPermissionsApiService) {}

  // Returns assigned sites in select dropdown format (site switcher); full sites + resolved features via SSE /auth/status
  @Get('sites/select')
  async getSitesSelect(@UserId() userId: string): Promise<SiteSelectResponseDto> {
    this.logger.log(`GET /api/user-permissions/sites/select — user: ${userId}`);
    return this.userPermissionsApiService.getSitesSelect(userId);
  }
}
