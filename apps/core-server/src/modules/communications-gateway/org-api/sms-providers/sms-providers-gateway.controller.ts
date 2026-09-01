import { CreateSmsProviderDto } from '@communications/sms-providers/dto/request/create-sms-provider.dto';
import { UpdateSmsProviderDto } from '@communications/sms-providers/dto/request/update-sms-provider.dto';
import type { SmsProviderResponseDto } from '@communications/sms-providers/dto/response/sms-provider-response.dto';
import type { SmsProviderTableResponseDto } from '@communications/sms-providers/dto/response/sms-provider-table-response.dto';
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
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_SMS_PROVIDERS } from '@vritti/communications-permissions/sms-providers';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateSmsProvider,
  ApiDeleteSmsProvider,
  ApiGetSmsProvider,
  ApiGetSmsProvidersTable,
  ApiUpdateSmsProvider,
} from './docs/sms-providers-gateway.docs';
import { SmsProvidersGatewayService } from './services/sms-providers-gateway.service';

@ApiTags('Communications - SMS Providers')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_SMS_PROVIDERS.featureCode)
@Controller('sms-providers')
export class SmsProvidersGatewayController {
  private readonly logger = new Logger(SmsProvidersGatewayController.name);

  constructor(private readonly service: SmsProvidersGatewayService) {}

  // The org's own providers plus the Vritti-managed platform rows
  @Get('table')
  @RequirePermission(ORG_SMS_PROVIDERS.view)
  @ApiGetSmsProvidersTable()
  getTable(@UserId() userId: string): Promise<SmsProviderTableResponseDto> {
    this.logger.log('GET /communications-api/sms-providers/table');
    return this.service.findForTable(userId);
  }

  @Get(':id')
  @RequirePermission(ORG_SMS_PROVIDERS.view)
  @ApiGetSmsProvider()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<SmsProviderResponseDto> {
    this.logger.log(`GET /communications-api/sms-providers/${id}`);
    return this.service.findById(id);
  }

  // Connects an organization-owned (CLIENT) provider account
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_SMS_PROVIDERS.add)
  @ApiCreateSmsProvider()
  create(@Body() dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderResponseDto>> {
    this.logger.log('POST /communications-api/sms-providers');
    return this.service.create(dto);
  }

  // Platform-managed rows are rejected downstream — they only change from the cloud admin panel
  @Patch(':id')
  @RequirePermission(ORG_SMS_PROVIDERS.edit)
  @ApiUpdateSmsProvider()
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateSmsProviderDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /communications-api/sms-providers/${id}`);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(ORG_SMS_PROVIDERS.delete)
  @ApiDeleteSmsProvider()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications-api/sms-providers/${id}`);
    return this.service.delete(id);
  }
}
