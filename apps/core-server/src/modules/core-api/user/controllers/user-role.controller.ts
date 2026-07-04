import { UserRoleService } from '@domain/user-role/services/user-role.service';
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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf, type SuccessResponseDto } from '@vritti/api-sdk';
import { CloudSignatureGuard } from '@/common/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/common/interceptors/org-scope.interceptor';
import type { UserRoleAssignment } from '@/db/schema';
import { ApiAssignRole, ApiListUserRoles, ApiRemoveRoleAssignment } from '../docs/user-role.docs';
import { AssignRoleInternalDto } from '../dto/request/assign-role-internal.dto';

@ApiTags('User Roles')
@Controller('users/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class UserRoleController {
  private readonly logger = new Logger(UserRoleController.name);

  constructor(private readonly userRoleService: UserRoleService) {}

  // Assigns a role to a user within a business unit
  @Post(':id/roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiAssignRole()
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/internal/${id}/roles`);
    return this.userRoleService.assignRole(id, dto);
  }

  // Lists all role assignments for a user
  @Get(':id/roles')
  @ApiListUserRoles()
  async listRoles(
    @Param('id') id: string,
  ): Promise<(UserRoleAssignment & { roleName: string; businessUnitName: string })[]> {
    this.logger.log(`GET /api/users/internal/${id}/roles`);
    return this.userRoleService.findRoleAssignments(id);
  }

  // Removes a role assignment from a user
  @Delete(':id/roles/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiRemoveRoleAssignment()
  async removeRole(@Param('id') _id: string, @Param('assignmentId') assignmentId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /api/users/internal/${_id}/roles/${assignmentId}`);
    return this.userRoleService.removeRoleAssignment(assignmentId);
  }
}
