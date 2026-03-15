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
import { Public, SkipCsrf, SuccessResponseDto } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '../../../common/guards/webhook-secret.guard';
import {
  ApiCreateUserWebhook,
  ApiGetUsersWebhook,
  ApiResendInviteWebhook,
  ApiUpdateUserWebhook,
} from '../docs/user.docs';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { GetUsersWebhookDto } from '../dto/request/get-users-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
import type { UsersTableResponseDto } from '../dto/response/users-table-response.dto';
import { UserService } from '../services/user.service';

@ApiTags('Users')
@Controller('users')
@SkipCsrf()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

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
