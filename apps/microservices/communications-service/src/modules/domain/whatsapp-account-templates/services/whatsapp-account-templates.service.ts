import { MetaGraphHttpService } from '@domain/meta-graph/services/meta-graph-http.service';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type MetaGraphLibraryTemplate, TemplateLibraryItemDto } from '../dto/entity/template-library-item.dto';
import { type MetaGraphTemplate, WhatsappTemplateDto } from '../dto/entity/whatsapp-template.dto';
import type { CreateWhatsappTemplateDto } from '../dto/request/create-whatsapp-template.dto';
import type { SendWhatsappTemplateTestDto } from '../dto/request/send-whatsapp-template-test.dto';

const TEMPLATE_FIELDS = 'id,name,status,category,language,quality_score,rejected_reason,components';

const LIBRARY_FIELDS =
  'id,name,language,category,topic,usecase,industry,header,body,body_params,body_param_types,buttons';

const LIBRARY_PAGE_LIMIT = 24;

// One page covers every realistic WABA today; Graph paging support is deferred until an account
// actually outgrows it
const TEMPLATE_PAGE_LIMIT = 100;

// Message templates are read live from Meta — the WABA is the source of truth for review status
// and quality, so nothing is persisted here (see the communications-permissions note)
@Injectable()
export class WhatsappAccountTemplatesDomainService {
  private readonly logger = new Logger(WhatsappAccountTemplatesDomainService.name);

  constructor(
    private readonly accountsService: WhatsappAccountsDomainService,
    private readonly metaGraph: MetaGraphHttpService,
  ) {}

  // Lists the WABA's message templates straight from Meta (one row per name+language pair)
  async list(accountId: string): Promise<WhatsappTemplateDto[]> {
    const { wabaId, accessToken } = await this.accountsService.resolveGraphCredentials(accountId);
    const response = await this.metaGraph.get<{ data: MetaGraphTemplate[] }>(
      accessToken,
      `/${wabaId}/message_templates`,
      { fields: TEMPLATE_FIELDS, limit: TEMPLATE_PAGE_LIMIT },
    );
    return (response.data ?? []).map(WhatsappTemplateDto.from);
  }

  // Browses Meta's library of pre-written templates. The library is global (not WABA-scoped) but
  // still needs a token, so it is resolved through the account like every other Graph call
  async listLibrary(
    accountId: string,
    filters: { search?: string; topic?: string; language?: string; category?: string } = {},
  ): Promise<TemplateLibraryItemDto[]> {
    const { accessToken } = await this.accountsService.resolveGraphCredentials(accountId);
    const response = await this.metaGraph.get<{ data: MetaGraphLibraryTemplate[] }>(
      accessToken,
      '/message_template_library',
      {
        fields: LIBRARY_FIELDS,
        limit: LIBRARY_PAGE_LIMIT,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.topic ? { topic: filters.topic } : {}),
        ...(filters.language ? { language: filters.language } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
    );
    return (response.data ?? []).map(TemplateLibraryItemDto.from);
  }

  // Distinct languages the library ships templates in — the panel's language selector is fed
  // from Meta rather than a hardcoded list
  async listLibraryLanguages(accountId: string): Promise<string[]> {
    const { accessToken } = await this.accountsService.resolveGraphCredentials(accountId);
    const response = await this.metaGraph.get<{ data: { language?: string }[] }>(
      accessToken,
      '/message_template_library',
      { fields: 'language', limit: 100 },
    );
    const languages = new Set((response.data ?? []).map((item) => item.language).filter((l): l is string => !!l));
    return [...languages].sort();
  }

  // Submits a template to Meta — custom content goes through review; a library reference is
  // pre-approved content and usually approves instantly
  async create(accountId: string, dto: CreateWhatsappTemplateDto): Promise<CreateResponseDto<WhatsappTemplateDto>> {
    const { wabaId, accessToken } = await this.accountsService.resolveGraphCredentials(accountId);

    const payload: Record<string, unknown> = {
      name: dto.name,
      language: dto.language,
      category: dto.category,
    };
    if (dto.libraryTemplateName) {
      payload.library_template_name = dto.libraryTemplateName;
      if (dto.libraryTemplateButtonInputs?.length) {
        payload.library_template_button_inputs = dto.libraryTemplateButtonInputs;
      }
    } else {
      payload.components = dto.components;
    }

    const created = await this.metaGraph.post<{ id: string; status?: string; category?: string }>(
      accessToken,
      `/${wabaId}/message_templates`,
      payload,
    );

    this.logger.log(`Submitted template ${dto.name} (${dto.language}) to WABA ${wabaId} — status ${created.status}`);

    return {
      success: true,
      message: created.status === 'APPROVED' ? 'Template created and approved.' : 'Template submitted for Meta review.',
      data: WhatsappTemplateDto.from({
        id: created.id,
        name: dto.name,
        status: created.status,
        category: created.category ?? dto.category,
        language: dto.language,
      }),
    };
  }

  // Deletes one template node. Meta requires the name alongside hsm_id — the id scopes the delete
  // to this name+language pair, while a name-only delete would wipe every language of the template
  async delete(accountId: string, templateId: string, name: string): Promise<SuccessResponseDto> {
    const { wabaId, accessToken } = await this.accountsService.resolveGraphCredentials(accountId);

    await this.metaGraph.delete(accessToken, `/${wabaId}/message_templates`, { hsm_id: templateId, name });

    this.logger.log(`Deleted template ${name} (${templateId}) from WABA ${wabaId}`);
    return { success: true, message: 'Template deleted successfully.' };
  }

  // Sends a real, billable template message from one of the WABA's registered numbers. Meta only
  // sends APPROVED templates and requires a value for every {{n}} body variable
  async sendTest(accountId: string, dto: SendWhatsappTemplateTestDto): Promise<SuccessResponseDto> {
    const { accessToken } = await this.accountsService.resolveGraphCredentials(accountId);

    const components: Record<string, unknown>[] = [];
    if (dto.bodyParams?.length) {
      components.push({ type: 'body', parameters: dto.bodyParams.map((text) => ({ type: 'text', text })) });
      // Authentication templates carry a copy-code button whose URL is dynamic — Meta requires the
      // code repeated as that button's parameter
      if (dto.category === 'AUTHENTICATION') {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: dto.bodyParams[0] }],
        });
      }
    }

    await this.metaGraph.post(accessToken, `/${dto.senderPhoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: dto.to,
      type: 'template',
      template: {
        name: dto.templateName,
        language: { code: dto.language },
        ...(components.length ? { components } : {}),
      },
    });

    this.logger.log(
      `Sent test template ${dto.templateName} (${dto.language}) to ${dto.to} from ${dto.senderPhoneNumberId}`,
    );
    return { success: true, message: 'Test message sent.' };
  }
}
