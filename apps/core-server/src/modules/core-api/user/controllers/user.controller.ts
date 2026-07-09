import { UserService } from '@domain/user/services/user.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, RequireSession, SkipCsrf } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { MobileLookupDto } from '../../auth/root/dto/request/mobile-lookup.dto';
import { MobileLookupResponseDto } from '../../auth/root/dto/response/mobile-lookup-response.dto';
import {
  ApiCreateUser,
  ApiGetOrganizationsByEmail,
  ApiGetUsers,
  ApiResendInvite,
  ApiUpdateUser,
} from '../docs/user.docs';
import { CreateUserInternalDto } from '../dto/request/create-user-internal.dto';
import { GetUsersInternalDto } from '../dto/request/get-users-internal.dto';
import { UpdateUserInternalDto } from '../dto/request/update-user-internal.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';

@ApiTags('Users')
@Controller('users')
@SkipCsrf()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('organizations-by-email')
  @Public()
  @ApiGetOrganizationsByEmail()
  async getOrganizationsByEmail(@Query() dto: MobileLookupDto): Promise<MobileLookupResponseDto> {
    this.logger.log(`GET /users/organizations-by-email?email=${dto.email}`);
    return this.userService.lookupOrganizationsByEmail(dto.email);
  }

  // Returns paginated user options for the select component
  @Get('select')
  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  findForSelect(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /users/select');
    return this.userService.findForSelect(query);
  }

  // Receives user creation from cloud-server via the internal API and upserts in nexus
  @Post('internal')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateUser()
  async createFromCloud(@Body() dto: CreateUserInternalDto): Promise<SuccessResponseDto> {
    this.logger.log('POST /api/users/internal');
    return this.userService.createFromCloud(dto);
  }

  // Returns paginated, filtered, and sorted portal users for the data table
  @Get('internal')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @ApiGetUsers()
  async getUsersByOrg(@Query() dto: GetUsersInternalDto): Promise<UsersTableResponseDto> {
    this.logger.log(`GET /users/internal?orgId=${dto.orgId}`);
    const filters = dto.filters ? JSON.parse(dto.filters) : [];
    const search = dto.search ? JSON.parse(dto.search) : null;
    const sort = dto.sort ? JSON.parse(dto.sort) : [];
    return this.userService.getUsersForTable(dto.orgId, filters, search, sort, dto.limit ?? 20, dto.offset ?? 0);
  }

  // Updates a portal user's details
  @Patch('internal/:id')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @ApiUpdateUser()
  async updateFromCloud(@Param('id') id: string, @Body() dto: UpdateUserInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /users/internal/${id}`);
    return this.userService.updateFromCloud(id, dto);
  }

  // Resends invitation email to a pending user with a fresh SET_PASSWORD token
  @Post('internal/:id/resend-invite')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.OK)
  @ApiResendInvite()
  async resendInvite(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/internal/${id}/resend-invite`);
    return this.userService.resendInvite(id);
  }
}
