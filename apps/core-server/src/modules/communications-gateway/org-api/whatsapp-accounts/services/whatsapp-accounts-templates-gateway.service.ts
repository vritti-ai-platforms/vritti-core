import type { CreateWhatsappTemplateDto } from '@communications/whatsapp-account-templates/dto/request/create-whatsapp-template.dto';
import type { SendWhatsappTemplateTestDto } from '@communications/whatsapp-account-templates/dto/request/send-whatsapp-template-test.dto';
import type { TemplateLibraryPageResponseDto } from '@communications/whatsapp-account-templates/dto/response/template-library-page-response.dto';
import type { WhatsappTemplateResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-response.dto';
import type { WhatsappTemplateTableResponseDto } from '@communications/whatsapp-account-templates/dto/response/whatsapp-template-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class WhatsappAccountsTemplatesGatewayService {
  private readonly logger = new Logger(WhatsappAccountsTemplatesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the WABA's message templates as a data table. The rows come live from Meta — the state
  // round-trip only carries column visibility etc.; Meta cannot sort or filter this list
  async findForTable(userId: string, accountId: string): Promise<WhatsappTemplateTableResponseDto> {
    this.logger.log(`whatsappAccounts.templates.list — account: ${accountId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'communications-org-whatsapp-templates',
    );

    const result = await this.nats.send<WhatsappTemplateResponseDto[]>(
      'communications',
      'org.whatsappAccounts.templates.list',
      { accountId },
    );

    return { result, count: result.length, state, activeViewId };
  }

  // Browses Meta's library of pre-written templates, one cursor page of matches at a time
  listLibrary(
    accountId: string,
    filters: { search?: string; topic?: string; language?: string; category?: string; limit?: number; cursor?: string },
  ): Promise<TemplateLibraryPageResponseDto> {
    this.logger.log(`whatsappAccounts.templates.libraryList — account: ${accountId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.templates.libraryList', {
      accountId,
      ...filters,
    });
  }

  // Distinct languages the library ships templates in
  listLibraryLanguages(accountId: string): Promise<string[]> {
    this.logger.log(`whatsappAccounts.templates.libraryLanguages — account: ${accountId}`);
    return this.nats.send('communications', 'org.whatsappAccounts.templates.libraryLanguages', { accountId });
  }

  // Submits a template to Meta — custom content or a pre-approved library reference
  create(accountId: string, dto: CreateWhatsappTemplateDto): Promise<CreateResponseDto<WhatsappTemplateResponseDto>> {
    this.logger.log(`whatsappAccounts.templates.create — account: ${accountId}, template: ${dto.name}`);
    return this.nats.send('communications', 'org.whatsappAccounts.templates.create', { accountId, ...dto });
  }

  // Deletes one template — Meta scopes the delete to the name+language node matching the template ID
  delete(accountId: string, templateId: string, name: string): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.templates.delete — account: ${accountId}, template: ${name}`);
    return this.nats.send('communications', 'org.whatsappAccounts.templates.delete', { accountId, templateId, name });
  }

  // Sends a real, billable template message to a recipient number
  sendTest(accountId: string, dto: SendWhatsappTemplateTestDto): Promise<SuccessResponseDto> {
    this.logger.log(`whatsappAccounts.templates.sendTest — account: ${accountId}, template: ${dto.templateName}`);
    return this.nats.send('communications', 'org.whatsappAccounts.templates.sendTest', { accountId, ...dto });
  }
}
