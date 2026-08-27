import type { TemplateLibraryItemDto } from '@domain/whatsapp-account-templates/dto/entity/template-library-item.dto';
import type { WhatsappTemplateDto } from '@domain/whatsapp-account-templates/dto/entity/whatsapp-template.dto';
import type { CreateWhatsappTemplateDto } from '@domain/whatsapp-account-templates/dto/request/create-whatsapp-template.dto';
import type { SendWhatsappTemplateTestDto } from '@domain/whatsapp-account-templates/dto/request/send-whatsapp-template-test.dto';
import {
  type GraphCredentials,
  WhatsappAccountTemplatesDomainService,
} from '@domain/whatsapp-account-templates/services/whatsapp-account-templates.service';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

// Resolves the account's Graph credentials and hands them to the templates domain, which owns no
// account lookup of its own — domain modules never import each other.
@Injectable()
export class WhatsappTemplatesService {
  constructor(
    private readonly accountsService: WhatsappAccountsDomainService,
    private readonly templatesService: WhatsappAccountTemplatesDomainService,
  ) {}

  // Lists the WABA's message templates
  async list(accountId: string): Promise<WhatsappTemplateDto[]> {
    return this.templatesService.list(await this.credentials(accountId));
  }

  // Browses Meta's library of pre-written templates
  async listLibrary(
    accountId: string,
    filters: { search?: string; topic?: string; language?: string; category?: string },
  ): Promise<TemplateLibraryItemDto[]> {
    return this.templatesService.listLibrary(await this.credentials(accountId), filters);
  }

  // Distinct languages the library ships templates in
  async listLibraryLanguages(accountId: string): Promise<string[]> {
    return this.templatesService.listLibraryLanguages(await this.credentials(accountId));
  }

  // Submits a template to Meta for review
  async create(accountId: string, dto: CreateWhatsappTemplateDto): Promise<CreateResponseDto<WhatsappTemplateDto>> {
    return this.templatesService.create(await this.credentials(accountId), dto);
  }

  // Deletes one name+language template node from the WABA
  async delete(accountId: string, templateId: string, name: string): Promise<SuccessResponseDto> {
    return this.templatesService.delete(await this.credentials(accountId), templateId, name);
  }

  // Sends a real, billable template message
  async sendTest(accountId: string, dto: SendWhatsappTemplateTestDto): Promise<SuccessResponseDto> {
    return this.templatesService.sendTest(await this.credentials(accountId), dto);
  }

  private async credentials(accountId: string): Promise<GraphCredentials> {
    return { accountId, ...(await this.accountsService.resolveGraphCredentials(accountId)) };
  }
}
