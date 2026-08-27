import { CreateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from '@communications/whatsapp-accounts/dto/request/update-whatsapp-account.dto';
import type { WhatsappAccountResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-response.dto';
import type { WhatsappAccountTableResponseDto } from '@communications/whatsapp-accounts/dto/response/whatsapp-account-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateWhatsappAccount,
  ApiDeleteWhatsappAccount,
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

  // Connects a WhatsApp Business Account
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.add)
  @ApiCreateWhatsappAccount()
  create(@Body() dto: CreateWhatsappAccountDto): Promise<CreateResponseDto<WhatsappAccountResponseDto>> {
    this.logger.log('POST /communications-api/whatsapp-accounts');
    return this.service.create(dto);
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
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.delete)
  @ApiDeleteWhatsappAccount()
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications-api/whatsapp-accounts/${id}`);
    return this.service.delete(id);
  }
}
