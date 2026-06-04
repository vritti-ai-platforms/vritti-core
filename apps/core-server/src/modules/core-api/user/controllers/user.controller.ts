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
import { Public, RequireSession, SelectOptionsQueryDto, type SelectQueryResult, SkipCsrf, SuccessResponseDto } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import {
  ApiCreateUserWebhook,
  ApiGetOrganizationsByEmail,
  ApiGetUsersWebhook,
  ApiResendInviteWebhook,
  ApiUpdateUserWebhook,
} from '../docs/user.docs';
import { MobileLookupDto } from '../../auth/root/dto/request/mobile-lookup.dto';
import { MobileLookupResponseDto } from '../../auth/root/dto/response/mobile-lookup-response.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { GetUsersWebhookDto } from '../dto/request/get-users-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';
import { UserService } from '@domain/user/services/user.service';

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
  @RequireSession(SessionTypeValues.NEXUS)
  findForSelect(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /users/select');
    return this.userService.findForSelect(query);
  }

  // Receives user creation from cloud-server via webhook and upserts in nexus
  @Post('webhook')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateUserWebhook()
  async createFromWebhook(@Body() dto: CreateUserWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log('POST /api/users/webhook');
    return this.userService.createFromWebhook(dto);
  }

  // Returns paginated, filtered, and sorted portal users for the data table
  @Get('webhook')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @ApiGetUsersWebhook()
  async getUsersByOrg(@Query() dto: GetUsersWebhookDto): Promise<UsersTableResponseDto> {
    this.logger.log(`GET /users/webhook?orgId=${dto.orgId}`);
    const filters = dto.filters ? JSON.parse(dto.filters) : [];
    const search = dto.search ? JSON.parse(dto.search) : null;
    const sort = dto.sort ? JSON.parse(dto.sort) : [];
    return this.userService.getUsersForTable(dto.orgId, filters, search, sort, dto.limit ?? 20, dto.offset ?? 0);
  }

  // Updates a portal user's details
  @Patch('webhook/:id')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @ApiUpdateUserWebhook()
  async updateFromWebhook(@Param('id') id: string, @Body() dto: UpdateUserWebhookDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /users/webhook/${id}`);
    return this.userService.updateFromWebhook(id, dto);
  }

  // Resends invitation email to a pending user with a fresh SET_PASSWORD token
  @Post('webhook/:id/resend-invite')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @HttpCode(HttpStatus.OK)
  @ApiResendInviteWebhook()
  async resendInvite(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/users/webhook/${id}/resend-invite`);
    return this.userService.resendInvite(id);
  }
}
