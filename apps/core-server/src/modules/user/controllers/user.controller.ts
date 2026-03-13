import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '../../../common/guards/webhook-secret.guard';
import { ApiCreateUserWebhook, ApiGetUsersWebhook, ApiUpdateUserWebhook } from '../docs/user.docs';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { GetUsersWebhookDto } from '../dto/request/get-users-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
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
  async createFromWebhook(@Body() dto: CreateUserWebhookDto): Promise<UserDto> {
    this.logger.log('POST /api/users/webhook');
    return this.userService.createFromWebhook(dto);
  }

  // Returns all portal users for an organisation
  @Get('webhook')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @ApiGetUsersWebhook()
  async getUsersByOrg(@Query() dto: GetUsersWebhookDto): Promise<UserDto[]> {
    this.logger.log(`GET /users/webhook?orgId=${dto.orgId}`);
    return this.userService.getUsersByOrg(dto.orgId);
  }

  // Updates a portal user's details
  @Patch('webhook/:id')
  @Public()
  @UseGuards(WebhookSecretGuard)
  @ApiUpdateUserWebhook()
  async updateFromWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateUserWebhookDto,
  ): Promise<UserDto> {
    this.logger.log(`PATCH /users/webhook/${id}`);
    return this.userService.updateFromWebhook(id, dto);
  }
}
