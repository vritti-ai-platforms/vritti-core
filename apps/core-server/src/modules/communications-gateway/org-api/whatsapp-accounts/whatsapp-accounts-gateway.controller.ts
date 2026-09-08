import { CreateEmbeddedSignupStateDto } from '@communications/whatsapp-accounts/dto/request/create-embedded-signup-state.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import type { EmbeddedSignupStateResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-state-response.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiCreateWhatsappConnectState,
  ApiCreateWhatsappReconnectState,
  ApiDeleteWhatsappAccount,
  ApiGetEmbeddedSignupConfig,
  ApiGetWhatsappAccount,
  ApiGetWhatsappAccountsTable,
  ApiUpdateWhatsappAccount,
} from './docs/whatsapp-accounts-gateway.docs';
import { WhatsappAccountsGatewayService } from './services/whatsapp-accounts-gateway.service';

@ApiTags('Communications - WhatsApp Accounts')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_WHATSAPP_ACCOUNTS.featureCode)
@Controller('whatsapp-accounts')
export class WhatsappAccountsGatewayController {
  private readonly logger = new Logger(WhatsappAccountsGatewayController.name);

  constructor(private readonly service: WhatsappAccountsGatewayService) {}

  // Returns the WhatsApp accounts data table
  @Get('table')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.view)
  @ApiGetWhatsappAccountsTable()
  getTable(@UserId() userId: string): Promise<WhatsappAccountTableResponseDto> {
    this.logger.log('GET /communications-api/whatsapp-accounts/table');
    return this.service.findForTable(userId);
  }

  // Whether this deployment can run Embedded Signup at all, so the UI can hide its buttons rather
  // than starting a flow that cannot finish.
  // Declared above @Get(':id') — that route is not UUID-piped, so a single-segment path here would
  // be swallowed by it.
  @Get('embedded-signup/config')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.add)
  @ApiGetEmbeddedSignupConfig()
  getEmbeddedSignupConfig(): EmbeddedSignupConfigResponseDto {
    this.logger.log('GET /communications-api/whatsapp-accounts/embedded-signup/config');
    return this.service.embeddedSignupConfig();
  }

  /**
   * Starts a connect and returns where to run it.
   *
   * This route replaces the old `POST embedded-signup`, which took the popup's result directly.
   * That could not survive per-organization subdomains: Meta enforces the SDK's host against a
   * fixed allowed-domain list, so the popup now runs on one shared origin and the account is
   * created there. This is consequently the last point at which the caller's grants are visible,
   * which is why `add` is enforced here and not on the completion endpoint.
   */
  @Post('embedded-signup/state')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.add)
  @ApiCreateWhatsappConnectState()
  createConnectState(
    @OrgId() organizationId: string,
    @UserId() userId: string,
    @Body() dto: CreateEmbeddedSignupStateDto,
  ): EmbeddedSignupStateResponseDto {
    this.logger.log('POST /communications-api/whatsapp-accounts/embedded-signup/state');
    return this.service.createConnectState(organizationId, userId, dto);
  }

  // Starts a credential replacement for one existing account. The account id rides in the minted
  // state, so the completion cannot be redirected onto a different row.
  @Post(':id/reconnect/state')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.edit)
  @ApiCreateWhatsappReconnectState()
  createReconnectState(
    @Param('id') id: string,
    @OrgId() organizationId: string,
    @UserId() userId: string,
    @Body() dto: CreateEmbeddedSignupStateDto,
  ): EmbeddedSignupStateResponseDto {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/reconnect/state`);
    return this.service.createReconnectState(id, organizationId, userId, dto);
  }

  // Returns a WhatsApp account by ID
  @Get(':id')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.view)
  @ApiGetWhatsappAccount()
  findById(@Param('id') id: string): Promise<WhatsappAccountResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}`);
    return this.service.findById(id);
  }

  // Updates a WhatsApp account by ID
  @Patch(':id')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.edit)
  @ApiUpdateWhatsappAccount()
  update(@Param('id') id: string, @Body() dto: UpdateWhatsappAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /communications-api/whatsapp-accounts/${id}`);
    return this.service.update(id, dto);
  }

  // Disconnects a WhatsApp account by ID
  @Delete(':id')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.disconnect)
  @ApiDeleteWhatsappAccount()
  delete(@Param('id') id: string, @OrgId() organizationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications-api/whatsapp-accounts/${id}`);
    return this.service.delete(id, organizationId);
  }
}
