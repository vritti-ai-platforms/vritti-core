import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '../../user/services/user.service';
import { UserPermissionsService } from '../services/user-permissions.service';

@ApiTags('User Permissions')
@ApiBearerAuth()
@Controller('user-permissions')
export class UserPermissionsController {
  private readonly logger = new Logger(UserPermissionsController.name);

  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly userService: UserService,
  ) {}

  // Returns assigned business units for the user
  @Get('business-units')
  async getBusinessUnits(@UserId() userId: string): Promise<any> {
    this.logger.log(`GET /api/user-permissions/business-units — user: ${userId}`);
    const user = await this.userService.findByIdOrThrow(userId);
    return this.userPermissionsService.getAssignedBusinessUnits(userId, user.organizationId);
  }

  // Returns assigned BUs in select dropdown format
  @Get('business-units/select')
  async getBusinessUnitsSelect(@UserId() userId: string): Promise<any> {
    this.logger.log(`GET /api/user-permissions/business-units/select — user: ${userId}`);
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
  @Get()
  async getPermissions(@UserId() userId: string, @Query('buId') buId: string): Promise<any> {
    this.logger.log(`GET /api/user-permissions?buId=${buId} — user: ${userId}`);
    const user = await this.userService.findByIdOrThrow(userId);
    return this.userPermissionsService.getPermissions(userId, buId, user.organizationId);
  }
}
