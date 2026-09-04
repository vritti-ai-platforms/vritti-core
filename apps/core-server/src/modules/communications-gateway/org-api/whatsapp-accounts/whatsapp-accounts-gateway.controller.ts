import { ConnectEmbeddedSignupDto } from '@communications/whatsapp-accounts/dto/request/connect-embedded-signup.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { EmbeddedSignupConfigResponseDto } from '@communications/whatsapp-accounts/dto/response/embedded-signup-config-response.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators';
import {
  ApiConnectWhatsappAccountEmbedded,
  ApiDeleteWhatsappAccount,
  ApiGetEmbeddedSignupConfig,
  ApiGetWhatsappAccount,
  ApiGetWhatsappAccountsTable,
  ApiReconnectWhatsappAccount,
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

  // Public Meta app values the browser needs to open the Embedded Signup popup.
  // Declared above @Get(':id') — that route is not UUID-piped, so a single-segment path here would
  // be swallowed by it.
  @Get('embedded-signup/config')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.add)
  @ApiGetEmbeddedSignupConfig()
  getEmbeddedSignupConfig(): EmbeddedSignupConfigResponseDto {
    this.logger.log('GET /communications-api/whatsapp-accounts/embedded-signup/config');
    return this.service.embeddedSignupConfig();
  }

  // Connects a WhatsApp Business Account from an Embedded Signup result
  @Post('embedded-signup')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.add)
  @ApiConnectWhatsappAccountEmbedded()
  connectEmbedded(@Body() dto: ConnectEmbeddedSignupDto): Promise<CreateResponseDto<WhatsappAccountResponseDto>> {
    this.logger.log('POST /communications-api/whatsapp-accounts/embedded-signup');
    return this.service.connectEmbedded(dto);
  }

  // Replaces an account's credential from a fresh Embedded Signup result
  @Post(':id/reconnect')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.edit)
  @ApiReconnectWhatsappAccount()
  reconnect(@Param('id') id: string, @Body() dto: ConnectEmbeddedSignupDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/reconnect`);
    return this.service.reconnect(id, dto);
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
