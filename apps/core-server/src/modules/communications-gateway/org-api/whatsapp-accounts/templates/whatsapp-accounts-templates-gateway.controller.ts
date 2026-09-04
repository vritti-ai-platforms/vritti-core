import { CreateWhatsappTemplateDto } from '@communications/whatsapp-account-templates/dto/request/create-whatsapp-template.dto';
import { SendWhatsappTemplateTestDto } from '@communications/whatsapp-account-templates/dto/request/send-whatsapp-template-test.dto';
import type { TemplateLibraryPageResponseDto } from '@communications/whatsapp-account-templates/dto/response/template-library-page-response.dto';
import type { WhatsappTemplateResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-response.dto';
import type { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateWhatsappTemplate,
  ApiDeleteWhatsappTemplate,
  ApiGetWhatsappTemplateLanguages,
  ApiGetWhatsappTemplateLibrary,
  ApiGetWhatsappTemplatesTable,
  ApiSendWhatsappTemplateTest,
} from '../docs/whatsapp-accounts-templates-gateway.docs';
import { WhatsappAccountsTemplatesGatewayService } from '../services/whatsapp-accounts-templates-gateway.service';

@ApiTags('Communications - WhatsApp Templates')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_WHATSAPP_ACCOUNTS.featureCode)
@Controller('whatsapp-accounts/:id/templates')
export class WhatsappAccountsTemplatesGatewayController {
  private readonly logger = new Logger(WhatsappAccountsTemplatesGatewayController.name);

  constructor(private readonly service: WhatsappAccountsTemplatesGatewayService) {}

  // Returns the WABA's message templates data table, rows read live from Meta
  @Get('table')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.view)
  @ApiGetWhatsappTemplatesTable()
  getTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<WhatsappTemplateTableResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/templates/table`);
    return this.service.findForTable(userId, id);
  }

  // Browses Meta's library of pre-written, pre-approved templates — part of the add flow
  @Get('library')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.add)
  @ApiGetWhatsappTemplateLibrary()
  getLibrary(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('search') search?: string,
    @Query('topic') topic?: string,
    @Query('language') language?: string,
    @Query('category') category?: string,
    @Query('cursor') cursor?: string,
    // Coerced here rather than with a pipe: a garbage value should fall back to the service default
    // instead of 400-ing a gallery browse
    @Query('limit') limit?: string,
  ): Promise<TemplateLibraryPageResponseDto> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/templates/library`);
    const parsed = Number(limit);
    return this.service.listLibrary(id, {
      search,
      topic,
      language,
      category,
      cursor,
      limit: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    });
  }

  // Distinct languages the library ships templates in — feeds the create wizard's language selector
  @Get('library/languages')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.add)
  @ApiGetWhatsappTemplateLanguages()
  getLibraryLanguages(@Param('id', new ParseUUIDPipe()) id: string): Promise<string[]> {
    this.logger.log(`GET /communications-api/whatsapp-accounts/${id}/templates/library/languages`);
    return this.service.listLibraryLanguages(id);
  }

  // Submits a template to Meta — custom content or a pre-approved library reference
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.add)
  @ApiCreateWhatsappTemplate()
  create(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateWhatsappTemplateDto,
  ): Promise<CreateResponseDto<WhatsappTemplateResponseDto>> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/templates`);
    return this.service.create(id, dto);
  }

  // Sends a real, billable template message from one of the WABA's registered numbers
  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.send)
  @ApiSendWhatsappTemplateTest()
  sendTest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendWhatsappTemplateTestDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /communications-api/whatsapp-accounts/${id}/templates/send-test`);
    return this.service.sendTest(id, dto);
  }

  // Deletes a template — Meta requires the name alongside the ID (the ID scopes it to one language).
  // :templateId is Meta's numeric template ID, so it is deliberately not UUID-piped.
  @Delete(':templateId')
  @RequirePermission(ORG_WHATSAPP_ACCOUNTS.templates.delete)
  @ApiDeleteWhatsappTemplate()
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('templateId') templateId: string,
    @Query('name') name: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications-api/whatsapp-accounts/${id}/templates/${templateId}`);
    return this.service.delete(id, templateId, name);
  }
}
