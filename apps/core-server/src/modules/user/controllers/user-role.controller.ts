import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type SuccessResponseDto, Public, SkipCsrf } from '@vritti/api-sdk';
import type { UserRoleAssignment } from '@/db/schema';
import { WebhookSecretGuard } from '../../../common/guards/webhook-secret.guard';
import { ApiAssignRoleWebhook, ApiListUserRolesWebhook, ApiRemoveRoleAssignmentWebhook } from '../docs/user-role.docs';
import { AssignRoleWebhookDto } from '../dto/request/assign-role-webhook.dto';
import { UserRoleService } from '../services/user-role.service';

@ApiTags('User Roles')
@Controller('users/webhook')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
export class UserRoleController {
  private readonly logger = new Logger(UserRoleController.name);

  constructor(private readonly userRoleService: UserRoleService) {}

  // Assigns a role to a user within a business unit
  @Post(':id/roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiAssignRoleWebhook()
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/webhook/${id}/roles`);
    return this.userRoleService.assignRole(id, dto);
  }

  // Lists all role assignments for a user
  @Get(':id/roles')
  @ApiListUserRolesWebhook()
  async listRoles(
    @Param('id') id: string,
  ): Promise<(UserRoleAssignment & { roleName: string; businessUnitName: string })[]> {
    this.logger.log(`GET /api/users/webhook/${id}/roles`);
    return this.userRoleService.findRoleAssignments(id);
  }

  // Removes a role assignment from a user
  @Delete(':id/roles/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiRemoveRoleAssignmentWebhook()
  async removeRole(
    @Param('id') _id: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/users/webhook/${_id}/roles/${assignmentId}`);
    return this.userRoleService.removeRoleAssignment(assignmentId);
  }
}
