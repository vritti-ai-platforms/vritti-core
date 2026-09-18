import type { AddSmsProviderTemplateDto } from '@communications/sms-provider-templates/dto/request/add-sms-provider-template.dto';
import type { SmsProviderTemplateResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-response.dto';
import type { SmsProviderTemplateTableResponseDto } from '@communications/sms-provider-templates/dto/response/sms-provider-template-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SmsProviderTemplatesGatewayService {
  private readonly logger = new Logger(SmsProviderTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  /**
   * Reads Vritti's rows rather than the vendor: MSG91 has no endpoint that lists an account's SMS
   * templates, so these rows are the list (see the schema note on sms_provider_templates).
   *
   * The state round-trip carries column visibility only — the row set is small and already scoped
   * to one provider, so it is not paginated downstream.
   */
  async findForTable(userId: string, providerId: string): Promise<SmsProviderTemplateTableResponseDto> {
    this.logger.log(`smsProviders.templates.list — provider: ${providerId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-sms-provider-templates',
    );

    const result = await this.nats.send<SmsProviderTemplateResponseDto[]>(
      'communications',
      'org.smsProviders.templates.list',
      { providerId },
    );

    return { result, count: result.length, state, activeViewId };
  }

  // Confirms the template with the vendor before it is stored
  add(providerId: string, dto: AddSmsProviderTemplateDto): Promise<CreateResponseDto<SmsProviderTemplateResponseDto>> {
    this.logger.log(`smsProviders.templates.add — provider: ${providerId}, template: ${dto.templateId}`);
    return this.nats.send('communications', 'org.smsProviders.templates.add', { providerId, ...dto });
  }

  // Re-reads one template from the vendor, replacing the stored snapshot
  refresh(templateId: string): Promise<SmsProviderTemplateResponseDto> {
    this.logger.log(`smsProviders.templates.refresh — id: ${templateId}`);
    return this.nats.send('communications', 'org.smsProviders.templates.refresh', { id: templateId });
  }

  // Forgets Vritti's row. Nothing is deleted at the vendor — unlike the WhatsApp templates tab,
  // whose delete reaches through to Meta.
  delete(templateId: string): Promise<SuccessResponseDto> {
    this.logger.log(`smsProviders.templates.delete — id: ${templateId}`);
    return this.nats.send('communications', 'org.smsProviders.templates.delete', { id: templateId });
  }
}
