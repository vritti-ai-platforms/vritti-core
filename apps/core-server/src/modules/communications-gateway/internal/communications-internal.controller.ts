import { CreateSmsProviderDto } from '@communications/sms-providers/dto/request/create-sms-provider.dto';
import { UpdateSmsProviderDto } from '@communications/sms-providers/dto/request/update-sms-provider.dto';
import type { SmsProviderResponseDto } from '@communications/sms-providers/dto/response/sms-provider-response.dto';
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
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { AppSmsOtpConfig, AppWhatsappOtpConfig } from '@/db/schema';
import { OrgId } from '@/security/decorators';
import type { SendSmsOtpResult } from '../org-api/sms-otps/services/sms-otps-gateway.service';
import type { SendOtpResult } from '../org-api/whatsapp-otps/services/whatsapp-otps-gateway.service';
import {
  ApiClearSmsOtpConfig,
  ApiClearWhatsappOtpConfig,
  ApiCreatePlatformSmsProvider,
  ApiDeletePlatformSmsProvider,
  ApiGetSmsOtpConfig,
  ApiGetWhatsappOtpConfig,
  ApiListOtpAccounts,
  ApiListOtpPhoneNumbers,
  ApiListOtpTemplates,
  ApiListSmsProviderOptions,
  ApiPlatformSmsProviders,
  ApiSetSmsOtpConfig,
  ApiSetWhatsappOtpConfig,
  ApiTestSmsOtpConfig,
  ApiTestWhatsappOtpConfig,
  ApiUpdatePlatformSmsProvider,
} from './docs/communications-internal.docs';
import { SetSmsOtpConfigDto } from './dto/request/set-sms-otp-config.dto';
import { SetWhatsappOtpConfigDto } from './dto/request/set-whatsapp-otp-config.dto';
import { TestSmsOtpConfigDto } from './dto/request/test-sms-otp-config.dto';
import { TestWhatsappOtpConfigDto } from './dto/request/test-whatsapp-otp-config.dto';
import type {
  OtpAccountOptionDto,
  OtpPhoneNumberOptionDto,
  OtpTemplateOptionDto,
} from './dto/response/otp-option-response.dto';
import type { SmsProviderOptionDto } from './dto/response/sms-provider-option-response.dto';
import { CommunicationsInternalService } from './services/communications-internal.service';

/**
 * Options the cloud-web OTP config screen needs, read from the `communications` schema.
 *
 * Cloud cannot reach a microservice directly, so it signs a request here and core forwards it over
 * NATS. The organization comes from the signed `x-org-id` header the guard established — never a
 * path parameter, which would let one organization enumerate another's senders.
 */
@ApiTags('Communications - Internal')
@Controller('communications/internal')
@SkipCsrf()
export class CommunicationsInternalController {
  private readonly logger = new Logger(CommunicationsInternalController.name);

  constructor(private readonly service: CommunicationsInternalService) {}

  // Returns the accounts an OTP config may send from
  @Get('otp-accounts')
  @Require(AuthType.Cloud)
  @ApiListOtpAccounts()
  listAccounts(): Promise<OtpAccountOptionDto[]> {
    this.logger.log('GET /communications/internal/otp-accounts');
    return this.service.listAccounts();
  }

  // Returns the sender numbers registered on an account
  @Get('otp-accounts/:accountId/phone-numbers')
  @Require(AuthType.Cloud)
  @ApiListOtpPhoneNumbers()
  listPhoneNumbers(@Param('accountId') accountId: string): Promise<OtpPhoneNumberOptionDto[]> {
    this.logger.log(`GET /communications/internal/otp-accounts/${accountId}/phone-numbers`);
    return this.service.listPhoneNumbers(accountId);
  }

  // Returns the approved AUTHENTICATION templates on an account
  @Get('otp-accounts/:accountId/templates')
  @Require(AuthType.Cloud)
  @ApiListOtpTemplates()
  listTemplates(@Param('accountId') accountId: string): Promise<OtpTemplateOptionDto[]> {
    this.logger.log(`GET /communications/internal/otp-accounts/${accountId}/templates`);
    return this.service.listTemplates(accountId);
  }

  // Returns the OTP configuration stored on an app
  @Get('whatsapp-otp-config/:appId')
  @Require(AuthType.Cloud)
  @ApiGetWhatsappOtpConfig()
  getWhatsappOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
  ): Promise<AppWhatsappOtpConfig | null> {
    this.logger.log(`GET /communications/internal/whatsapp-otp-config/${appId}`);
    return this.service.getWhatsappOtpConfig(appId, organizationId);
  }

  // Stores the OTP configuration after checking the selection still exists in Meta
  @Put('whatsapp-otp-config/:appId')
  @HttpCode(HttpStatus.OK)
  @Require(AuthType.Cloud)
  @ApiSetWhatsappOtpConfig()
  setWhatsappOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
    @Body() dto: SetWhatsappOtpConfigDto,
  ): Promise<AppWhatsappOtpConfig> {
    this.logger.log(`PUT /communications/internal/whatsapp-otp-config/${appId}`);
    return this.service.setWhatsappOtpConfig(appId, organizationId, dto);
  }

  // Sends a real code with the stored config so an operator can prove the setup works
  @Post('whatsapp-otp-config/:appId/test')
  @HttpCode(HttpStatus.OK)
  @Require(AuthType.Cloud)
  @ApiTestWhatsappOtpConfig()
  testWhatsappOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
    @Body() dto: TestWhatsappOtpConfigDto,
  ): Promise<SendOtpResult> {
    this.logger.log(`POST /communications/internal/whatsapp-otp-config/${appId}/test`);
    return this.service.testWhatsappOtpConfig(appId, organizationId, dto.recipient);
  }

  // Turns sign-in codes off for an app
  @Delete('whatsapp-otp-config/:appId')
  @Require(AuthType.Cloud)
  @ApiClearWhatsappOtpConfig()
  async clearWhatsappOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications/internal/whatsapp-otp-config/${appId}`);
    await this.service.clearWhatsappOtpConfig(appId, organizationId);
    return { success: true, message: 'WhatsApp sign-in codes turned off for this app.' };
  }

  // ---- Platform SMS providers — Vritti-owned rows every org can use, managed only from cloud.
  // These deliberately carry no org context: the NATS calls run without RLS headers, so the table
  // policy scopes them to the NULL-org rows and they can never touch a client's provider. ----

  @Get('sms-providers')
  @Require(AuthType.Cloud)
  @ApiPlatformSmsProviders()
  listSmsProviders(): Promise<SmsProviderResponseDto[]> {
    this.logger.log('GET /communications/internal/sms-providers');
    return this.service.listPlatformSmsProviders();
  }

  @Post('sms-providers')
  @HttpCode(HttpStatus.CREATED)
  @Require(AuthType.Cloud)
  @ApiCreatePlatformSmsProvider()
  createSmsProvider(@Body() dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderResponseDto>> {
    this.logger.log('POST /communications/internal/sms-providers');
    return this.service.createPlatformSmsProvider(dto);
  }

  @Put('sms-providers/:id')
  @HttpCode(HttpStatus.OK)
  @Require(AuthType.Cloud)
  @ApiUpdatePlatformSmsProvider()
  updateSmsProvider(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSmsProviderDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /communications/internal/sms-providers/${id}`);
    return this.service.updatePlatformSmsProvider(id, dto);
  }

  @Delete('sms-providers/:id')
  @Require(AuthType.Cloud)
  @ApiDeletePlatformSmsProvider()
  deleteSmsProvider(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications/internal/sms-providers/${id}`);
    return this.service.deletePlatformSmsProvider(id);
  }
  // ---- SMS OTP config — the SMS sibling of the whatsapp-otp-config endpoints above ----

  // Active providers an SMS OTP config may send through (org-scoped: own rows + platform rows)
  @Get('sms-provider-options')
  @Require(AuthType.Cloud)
  @ApiListSmsProviderOptions()
  listSmsProviderOptions(@OrgId() _organizationId: string): Promise<SmsProviderOptionDto[]> {
    this.logger.log('GET /communications/internal/sms-provider-options');
    return this.service.listSmsProviderOptions();
  }

  // Returns the SMS OTP configuration stored on an app
  @Get('sms-otp-config/:appId')
  @Require(AuthType.Cloud)
  @ApiGetSmsOtpConfig()
  getSmsOtpConfig(@Param('appId') appId: string, @OrgId() organizationId: string): Promise<AppSmsOtpConfig | null> {
    this.logger.log(`GET /communications/internal/sms-otp-config/${appId}`);
    return this.service.getSmsOtpConfig(appId, organizationId);
  }

  // Stores the SMS OTP configuration after checking the provider still exists and is active
  @Put('sms-otp-config/:appId')
  @HttpCode(HttpStatus.OK)
  @Require(AuthType.Cloud)
  @ApiSetSmsOtpConfig()
  setSmsOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
    @Body() dto: SetSmsOtpConfigDto,
  ): Promise<AppSmsOtpConfig> {
    this.logger.log(`PUT /communications/internal/sms-otp-config/${appId}`);
    return this.service.setSmsOtpConfig(appId, organizationId, dto);
  }

  // Sends a real code with the stored config so an operator can prove the setup works
  @Post('sms-otp-config/:appId/test')
  @HttpCode(HttpStatus.OK)
  @Require(AuthType.Cloud)
  @ApiTestSmsOtpConfig()
  testSmsOtpConfig(
    @Param('appId') appId: string,
    @OrgId() organizationId: string,
    @Body() dto: TestSmsOtpConfigDto,
  ): Promise<SendSmsOtpResult> {
    this.logger.log(`POST /communications/internal/sms-otp-config/${appId}/test`);
    return this.service.testSmsOtpConfig(appId, organizationId, dto.recipient);
  }

  // Turns SMS sign-in codes off for an app
  @Delete('sms-otp-config/:appId')
  @Require(AuthType.Cloud)
  @ApiClearSmsOtpConfig()
  async clearSmsOtpConfig(@Param('appId') appId: string, @OrgId() organizationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /communications/internal/sms-otp-config/${appId}`);
    await this.service.clearSmsOtpConfig(appId, organizationId);
    return { success: true, message: 'SMS sign-in codes turned off for this app.' };
  }
}
