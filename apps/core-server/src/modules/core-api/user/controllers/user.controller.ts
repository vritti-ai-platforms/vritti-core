import { CreateUserInternalDto } from '@domain/user/dto/request/create-user-internal.dto';
import { UpdateUserInternalDto } from '@domain/user/dto/request/update-user-internal.dto';
import type { UsersTableResponseDto } from '@domain/user/dto/response/users-table-response.dto';
import { UserDomainService } from '@domain/user/services/user.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { MobileLookupDto } from '../../auth/root/dto/request/mobile-lookup.dto';
import { MobileLookupResponseDto } from '../../auth/root/dto/response/mobile-lookup-response.dto';
import {
  ApiCreateUser,
  ApiDeleteUser,
  ApiGetOrganizationsByEmail,
  ApiGetUsers,
  ApiResendInvite,
  ApiUpdateUser,
} from '../docs/user.docs';
import { GetUsersInternalDto } from '../dto/request/get-users-internal.dto';

@ApiTags('Users')
@Controller('users')
@SkipCsrf()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserDomainService) {}

  @Get('organizations-by-email')
  @Require(AuthType.Public)
  @ApiGetOrganizationsByEmail()
  async getOrganizationsByEmail(@Query() dto: MobileLookupDto): Promise<MobileLookupResponseDto> {
    this.logger.log(`GET /users/organizations-by-email?email=${dto.email}`);
    return this.userService.lookupOrganizationsByEmail(dto.email);
  }

  // Returns paginated user options for the select component
  @Get('select')
  @Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  findForSelect(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /users/select');
    return this.userService.findForSelect(query);
  }

  // Receives user creation from cloud-server via the internal API and upserts in nexus
  @Post('internal')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateUser()
  async createFromCloud(@OrgId() orgId: string, @Body() dto: CreateUserInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/internal — org ${orgId}`);
    return this.userService.createFromCloud(orgId, dto);
  }

  // Returns paginated, filtered, and sorted portal users for the data table
  @Get('internal')
  @Require(AuthType.Cloud)
  @ApiGetUsers()
  async getUsersByOrg(@OrgId() orgId: string, @Query() dto: GetUsersInternalDto): Promise<UsersTableResponseDto> {
    this.logger.log(`GET /users/internal — org ${orgId}`);
    const filters = dto.filters ? JSON.parse(dto.filters) : [];
    const search = dto.search ? JSON.parse(dto.search) : null;
    const sort = dto.sort ? JSON.parse(dto.sort) : [];
    return this.userService.getUsersForTable(orgId, filters, search, sort, dto.limit ?? 20, dto.offset ?? 0);
  }

  // Updates a portal user's details
  @Patch('internal/:id')
  @Require(AuthType.Cloud)
  @ApiUpdateUser()
  async updateFromCloud(@Param('id') id: string, @Body() dto: UpdateUserInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /users/internal/${id}`);
    return this.userService.updateFromCloud(id, dto);
  }

  // Permanently deletes a portal user and signs out their live connections
  @Delete('internal/:id')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  @ApiDeleteUser()
  async deleteFromCloud(@OrgId() orgId: string, @Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /users/internal/${id} — org ${orgId}`);
    return this.userService.deleteFromCloud(orgId, id);
  }

  // Resends invitation email to a pending user with a fresh SET_PASSWORD token
  @Post('internal/:id/resend-invite')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  @ApiResendInvite()
  async resendInvite(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/internal/${id}/resend-invite`);
    return this.userService.resendInvite(id);
  }
}
