import { AddSmsProviderTemplateDto } from '@communications/sms-provider-templates/dto/request/add-sms-provider-template.dto';
import type { SmsProviderTemplateResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-response.dto';
import type { SmsProviderTemplateTableResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-table-response.dto';
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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiAddSmsProviderTemplate,
  ApiDeleteSmsProviderTemplate,
  ApiGetSmsProviderTemplates,
  ApiRefreshSmsProviderTemplate,
} from '../docs/sms-provider-templates-gateway.docs';
import { SmsProviderTemplatesGatewayService } from '../services/sms-provider-templates-gateway.service';

@ApiTags('Communications - SMS Provider Templates')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_SMS_PROVIDERS.featureCode)
@Controller('sms-providers/:id/templates')
export class SmsProviderTemplatesGatewayController {
  private readonly logger = new Logger(SmsProviderTemplatesGatewayController.name);

  constructor(private readonly service: SmsProviderTemplatesGatewayService) {}

  // Vritti's rows, not a vendor call — MSG91 cannot enumerate an account's SMS templates
  @Get('table')
  @RequirePermission(ORG_SMS_PROVIDERS.templates.view)
  @ApiGetSmsProviderTemplates()
  getTable(
    @UserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SmsProviderTemplateTableResponseDto> {
    this.logger.log(`GET /communications-api/sms-providers/${id}/templates/table`);
    return this.service.findForTable(userId, id);
  }

  // The vendor confirms the template exists before anything is stored
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_SMS_PROVIDERS.templates.add)
  @ApiAddSmsProviderTemplate()
  add(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddSmsProviderTemplateDto,
  ): Promise<CreateResponseDto<SmsProviderTemplateResponseDto>> {
    this.logger.log(`POST /communications-api/sms-providers/${id}/templates`);
    return this.service.add(id, dto);
  }

  // Re-reads the vendor snapshot. Gated on view rather than add: it changes nothing an operator
  // chose, it only makes what is displayed current.
  @Post(':templateId/refresh')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(ORG_SMS_PROVIDERS.templates.view)
  @ApiRefreshSmsProviderTemplate()
  refresh(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ): Promise<SmsProviderTemplateResponseDto> {
    this.logger.log(`POST /communications-api/sms-providers/${id}/templates/${templateId}/refresh`);
    return this.service.refresh(templateId);
  }

  // Removes Vritti's row only — the template stays in MSG91
  @Delete(':templateId')
  @RequirePermission(ORG_SMS_PROVIDERS.templates.delete)
  @ApiDeleteSmsProviderTemplate()
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications-api/sms-providers/${id}/templates/${templateId}`);
    return this.service.delete(templateId);
  }
}
