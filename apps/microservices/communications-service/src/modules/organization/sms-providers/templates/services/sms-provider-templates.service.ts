import { SmsProviderTemplateDto } from '@domain/sms-provider-templates/dto/entity/sms-provider-template.dto';
import type { AddSmsProviderTemplateDto } from '@domain/sms-provider-templates/dto/request/add-sms-provider-template.dto';
import { SmsProviderTemplatesDomainService } from '@domain/sms-provider-templates/services/sms-provider-templates.service';
import { SmsProviderRegistry } from '@domain/sms-providers/services/sms-provider-transports';
import { SmsProvidersDomainService } from '@domain/sms-providers/services/sms-providers.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

/**
 * Orchestrates the two domains a template touches — the provider row that holds the credentials,
 * and the template rows themselves. Domain modules never import each other, so the vendor round
 * trip is composed here rather than inside either of them.
 *
 * Every write goes to MSG91 first: a row is only ever stored for a template the vendor confirmed,
 * which is also the only proof we get that the stored auth key works.
 */
@Injectable()
export class SmsProviderTemplatesService {
  private readonly logger = new Logger(SmsProviderTemplatesService.name);

  constructor(
    private readonly templatesService: SmsProviderTemplatesDomainService,
    private readonly providersService: SmsProvidersDomainService,
    private readonly registry: SmsProviderRegistry,
  ) {}

  // Reads from our rows, not the vendor — MSG91 cannot enumerate an account's SMS templates
  findForProvider(providerId: string): Promise<SmsProviderTemplateDto[]> {
    return this.templatesService.findForProvider(providerId);
  }

  // Confirms the template exists on the provider's account, then records it
  async add(providerId: string, dto: AddSmsProviderTemplateDto): Promise<CreateResponseDto<SmsProviderTemplateDto>> {
    const snapshot = await this.fetchFromVendor(providerId, dto.templateId);
    const template = await this.templatesService.add(providerId, dto, snapshot);

    this.logger.log(`Added template ${dto.templateId} to provider ${providerId}`);
    return { success: true, message: 'Template added successfully.', data: template };
  }

  // Re-reads one template from the vendor, replacing the stored snapshot
  async refresh(id: string): Promise<SmsProviderTemplateDto> {
    const existing = await this.templatesService.requireById(id);
    const snapshot = await this.fetchFromVendor(existing.providerId, existing.templateId);

    this.logger.log(`Refreshed template ${existing.templateId} on provider ${existing.providerId}`);
    return this.templatesService.applyRefresh(id, snapshot);
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.templatesService.delete(id);
  }

  // Resolves the provider's credentials and asks its transport for the template. The provider need
  // not be active — curating the templates of a paused provider is legitimate.
  private async fetchFromVendor(providerId: string, templateId: string): Promise<Record<string, unknown>> {
    const { provider, credentials } = await this.providersService.resolveTemplateContext(providerId);
    const { fetchTemplate } = this.registry.resolveTemplateCapable(provider);
    return fetchTemplate(credentials, templateId);
  }
}
