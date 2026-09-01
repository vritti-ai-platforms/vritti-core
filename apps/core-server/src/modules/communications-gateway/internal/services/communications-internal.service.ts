import type { CreateSmsProviderDto } from '@communications/sms-providers/dto/request/create-sms-provider.dto';
import type { UpdateSmsProviderDto } from '@communications/sms-providers/dto/request/update-sms-provider.dto';
import type { SmsProviderResponseDto } from '@communications/sms-providers/dto/response/sms-provider-response.dto';
import type { WhatsappPhoneNumberResponseDto } from '@communications/whatsapp-account-phone-numbers/dto/response/whatsapp-phone-number-response.dto';
import type { WhatsappTemplateResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AppOtpConfig } from '@/db/schema';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import type { SendOtpResult } from '../../org-api/whatsapp-otps/services/whatsapp-otps-gateway.service';
import type {
  OtpAccountOptionDto,
  OtpPhoneNumberOptionDto,
  OtpTemplateOptionDto,
} from '../dto/response/otp-option-response.dto';

const OTP_TEMPLATE_CATEGORY = 'AUTHENTICATION';
const APPROVED = 'APPROVED';
const SELECT_LIMIT = 100;

@Injectable()
export class CommunicationsInternalService {
  private readonly logger = new Logger(CommunicationsInternalService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly appService: AppDomainService,
  ) {}

  // Connected WhatsApp accounts the OTP config may send from
  async listAccounts(): Promise<OtpAccountOptionDto[]> {
    this.logger.log('select.whatsappAccounts');
    const { options } = await this.nats.send<SelectQueryResult>('communications', 'select.whatsappAccounts', {
      valueKey: 'id',
      labelKey: 'name',
      additionalKeys: 'wabaId,isActive',
      limit: SELECT_LIMIT,
    } satisfies SelectOptionsQueryDto);

    // A disabled account cannot send, so offering one would only produce a config that fails at Meta
    return options
      .filter((option) => option.additionals?.isActive)
      .map((option) => ({
        id: String(option.value),
        name: option.label,
        wabaId: String(option.additionals?.wabaId ?? ''),
      }));
  }

  // Numbers registered on an account, read live from Meta
  async listPhoneNumbers(accountId: string): Promise<OtpPhoneNumberOptionDto[]> {
    this.logger.log(`org.whatsappAccounts.phoneNumbers.list — account: ${accountId}`);
    const numbers = await this.nats.send<WhatsappPhoneNumberResponseDto[]>(
      'communications',
      'org.whatsappAccounts.phoneNumbers.list',
      { accountId },
    );
    return numbers.map((number) => ({
      id: number.id,
      displayPhoneNumber: number.displayPhoneNumber,
      verifiedName: number.verifiedName,
    }));
  }

  // Only approved AUTHENTICATION templates can carry a sign-in code, so nothing else is offered
  async listTemplates(accountId: string): Promise<OtpTemplateOptionDto[]> {
    this.logger.log(`org.whatsappAccounts.templates.list — account: ${accountId}`);
    const templates = await this.nats.send<WhatsappTemplateResponseDto[]>(
      'communications',
      'org.whatsappAccounts.templates.list',
      { accountId },
    );
    return templates
      .filter((template) => template.category === OTP_TEMPLATE_CATEGORY && template.status === APPROVED)
      .map((template) => ({
        name: template.name,
        language: template.language ?? '',
        status: template.status ?? '',
      }));
  }

  // Returns the OTP config stored on an app, or null when it has never been set up
  async getConfig(appId: string, organizationId: string): Promise<AppOtpConfig | null> {
    const app = await this.appService.findInOrg(appId, organizationId);
    if (!app) throw new NotFoundException('App not found.');
    return app.otpConfig ?? null;
  }

  // Validates the selection against Meta before storing it, so a broken config fails here not at send time
  async setConfig(appId: string, organizationId: string, config: AppOtpConfig): Promise<AppOtpConfig> {
    const app = await this.appService.findInOrg(appId, organizationId);
    if (!app) throw new NotFoundException('App not found.');

    await this.validateConfig(config);
    const updated = await this.appService.setOtpConfig(appId, config);
    return updated.otpConfig as AppOtpConfig;
  }

  // Turns sign-in codes off for an app
  async clearConfig(appId: string, organizationId: string): Promise<void> {
    const app = await this.appService.findInOrg(appId, organizationId);
    if (!app) throw new NotFoundException('App not found.');
    await this.appService.setOtpConfig(appId, null);
  }

  // Sends a real code using the app's stored config, so an operator can prove the setup end to end
  async testConfig(appId: string, organizationId: string, recipient: string): Promise<SendOtpResult> {
    const config = await this.getConfig(appId, organizationId);
    if (!config) {
      throw new BadRequestException({
        label: 'OTP not configured',
        detail: 'Save a WhatsApp sign-in configuration for this app before sending a test code.',
      });
    }

    this.logger.log(`org.whatsappOtps.send — test for app ${appId}`);
    // orgId is not passed explicitly: the cloud-signed request already carries it on request.auth,
    // which the NATS context resolver reads
    return this.nats.send('communications', 'org.whatsappOtps.send', {
      appId,
      accountId: config.accountId,
      phoneNumberId: config.phoneNumberId,
      templateName: config.templateName,
      templateLanguage: config.templateLanguage,
      recipient,
      codeLength: config.codeLength,
      expirySeconds: config.expirySeconds,
      maxAttempts: config.maxAttempts,
      resendCooldownSeconds: config.resendCooldownSeconds,
    });
  }

  // Rejects a config naming an account, sender, or template that does not exist or cannot carry a code
  async validateConfig(config: AppOtpConfig): Promise<void> {
    const accounts = await this.listAccounts();
    if (!accounts.some((account) => account.id === config.accountId)) {
      throw new BadRequestException({
        label: 'Unknown WhatsApp account',
        detail: 'The selected WhatsApp account is not connected to this organization.',
      });
    }

    const [numbers, templates] = await Promise.all([
      this.listPhoneNumbers(config.accountId),
      this.listTemplates(config.accountId),
    ]);

    if (!numbers.some((number) => number.id === config.phoneNumberId)) {
      throw new BadRequestException({
        label: 'Unknown sender',
        detail: 'The selected phone number is not registered on that WhatsApp account.',
      });
    }

    const template = templates.find(
      (candidate) => candidate.name === config.templateName && candidate.language === config.templateLanguage,
    );
    if (!template) {
      throw new BadRequestException({
        label: 'Unusable template',
        detail: 'Pick an approved AUTHENTICATION template — only those can carry a sign-in code.',
      });
    }
  }
  // ---- Platform SMS providers — the calls carry no org headers, so the microservice's RLS
  // policy scopes them to the NULL-org rows and they can never touch a client's provider ----

  listPlatformSmsProviders(): Promise<SmsProviderResponseDto[]> {
    this.logger.log('internal.smsProviders.list');
    return this.nats.send('communications', 'internal.smsProviders.list', {});
  }

  createPlatformSmsProvider(dto: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderResponseDto>> {
    this.logger.log(`internal.smsProviders.create — provider: ${dto.provider}`);
    return this.nats.send('communications', 'internal.smsProviders.create', dto);
  }

  updatePlatformSmsProvider(id: string, dto: UpdateSmsProviderDto): Promise<SuccessResponseDto> {
    this.logger.log(`internal.smsProviders.update — id: ${id}`);
    return this.nats.send('communications', 'internal.smsProviders.update', { id, ...dto });
  }

  deletePlatformSmsProvider(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`internal.smsProviders.delete — id: ${id}`);
    return this.nats.send('communications', 'internal.smsProviders.delete', { id });
  }
}
