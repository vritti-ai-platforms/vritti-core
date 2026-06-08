import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from '@vritti/api-sdk';
import type { BuSelectResponseDto } from '../dto/response/bu-select-response.dto';
import { UserPermissionsApiService } from '../services/user-permissions-api.service';

@ApiTags('User Permissions')
@ApiBearerAuth()
@Controller('user-permissions')
export class UserPermissionsController {
  private readonly logger = new Logger(UserPermissionsController.name);

  constructor(private readonly userPermissionsApiService: UserPermissionsApiService) {}

  // Returns assigned BUs in select dropdown format (BU switcher).
  // Full BUs + resolved features are delivered via the SSE /auth/status stream, not REST.
  @Get('business-units/select')
  async getBusinessUnitsSelect(@UserId() userId: string): Promise<BuSelectResponseDto> {
    this.logger.log(`GET /api/user-permissions/business-units/select — user: ${userId}`);
    return this.userPermissionsApiService.getBusinessUnitsSelect(userId);
  }
}
