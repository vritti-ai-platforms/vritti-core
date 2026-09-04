import { MetaGraphHttpService } from '@domain/meta-graph/services/meta-graph-http.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { type MetaGraphLibraryTemplate, TemplateLibraryItemDto } from '../dto/entity/template-library-item.dto';
import type { TemplateLibraryPageDto } from '../dto/entity/template-library-page.dto';
import { type MetaGraphTemplate, WhatsappTemplateDto } from '../dto/entity/whatsapp-template.dto';
import type { CreateWhatsappTemplateDto } from '../dto/request/create-whatsapp-template.dto';
import type { SendWhatsappTemplateTestDto } from '../dto/request/send-whatsapp-template-test.dto';

const TEMPLATE_FIELDS = 'id,name,status,category,language,quality_score,rejected_reason,components';

const LIBRARY_FIELDS =
  'id,name,language,category,topic,usecase,industry,header,body,body_params,body_param_types,buttons';

// How many matching entries a page of the gallery asks for
const LIBRARY_PAGE_LIMIT = 24;

// Entries requested per underlying Meta call while collecting that page
const LIBRARY_FETCH_LIMIT = 100;

/**
 * Ceiling on Meta calls per request.
 *
 * `category` is NOT honoured as a query parameter — verified against Graph: `language=en_US` filters
 * correctly, `language=en_US&category=UTILITY` still returns AUTHENTICATION entries. So category is
 * narrowed here, which means a page of matches can require walking several Meta pages. The cap stops
 * a rare category/language combination from turning one request into an unbounded crawl.
 */
const LIBRARY_MAX_PAGES = 8;

// Pages walked when collecting the distinct language list. Bounded for the same reason, and the
// result is cached hard by the caller since it never meaningfully changes.
const LANGUAGE_MAX_PAGES = 6;

interface MetaGraphPagedResponse<T> {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
}

// One page covers every realistic WABA today; Graph paging support is deferred until an account
// actually outgrows it
const TEMPLATE_PAGE_LIMIT = 100;

export interface GraphCredentials {
  accountId: string;
  wabaId: string;
  accessToken: string;
}

export interface SendTemplateParams {
  senderPhoneNumberId: string;
  to: string;
  templateName: string;
  language: string;
  bodyParams?: string[];
  category?: string;
}

// Message templates are read live from Meta — the WABA is the source of truth for review status
// and quality, so nothing is persisted here (see the communications-permissions note)
@Injectable()
export class WhatsappAccountTemplatesDomainService {
  private readonly logger = new Logger(WhatsappAccountTemplatesDomainService.name);

  constructor(private readonly metaGraph: MetaGraphHttpService) {}

  // Lists the WABA's message templates straight from Meta (one row per name+language pair)
  async list(credentials: GraphCredentials): Promise<WhatsappTemplateDto[]> {
    const { wabaId, accessToken } = credentials;
    const response = await this.metaGraph.get<{ data: MetaGraphTemplate[] }>(
      accessToken,
      `/${wabaId}/message_templates`,
      { fields: TEMPLATE_FIELDS, limit: TEMPLATE_PAGE_LIMIT },
    );
    return (response.data ?? []).map(WhatsappTemplateDto.from);
  }

  /**
   * Browses Meta's library of pre-written templates. The library is global (not WABA-scoped) but
   * still needs a token, so it is resolved through the account like every other Graph call.
   *
   * Walks Meta's cursor pages until it has a full page of matches, because the library is far larger
   * than one page and `category` is filtered here rather than by Meta. Returning fewer than
   * `limit` items alongside a non-null cursor is normal — the caller keeps asking.
   */
  async listLibrary(
    credentials: GraphCredentials,
    filters: {
      search?: string;
      topic?: string;
      language?: string;
      category?: string;
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<TemplateLibraryPageDto> {
    const { accessToken } = credentials;
    const wanted = filters.limit ?? LIBRARY_PAGE_LIMIT;
    const category = filters.category?.toUpperCase();

    const matches: MetaGraphLibraryTemplate[] = [];
    let cursor = filters.cursor;
    let pages = 0;

    do {
      const response = await this.metaGraph.get<MetaGraphPagedResponse<MetaGraphLibraryTemplate>>(
        accessToken,
        '/message_template_library',
        {
          fields: LIBRARY_FIELDS,
          limit: LIBRARY_FETCH_LIMIT,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.topic ? { topic: filters.topic } : {}),
          // Honoured by Meta, unlike category — still sent so the crawl starts already narrowed
          ...(filters.language ? { language: filters.language } : {}),
          ...(cursor ? { after: cursor } : {}),
        },
      );
      pages += 1;

      for (const item of response.data ?? []) {
        if (category && item.category?.toUpperCase() !== category) continue;
        matches.push(item);
      }

      // A missing `next` means the library is exhausted, so there is nothing to resume from
      cursor = response.paging?.next ? response.paging.cursors?.after : undefined;
    } while (cursor && matches.length < wanted && pages < LIBRARY_MAX_PAGES);

    this.logger.log(
      `Library browse — ${matches.length} match(es) over ${pages} Meta page(s) (category=${category ?? 'any'}, language=${filters.language ?? 'any'})`,
    );

    // Whole pages only: slicing to `wanted` would drop matches the cursor has already advanced past
    return { items: matches.map(TemplateLibraryItemDto.from), nextCursor: cursor ?? null };
  }

  /**
   * Distinct languages the library ships templates in, fed to the wizard's selector.
   *
   * Pages rather than reading one batch: entries are not grouped by language, so a single page
   * surfaces an arbitrary handful (nb, fr, mr, hu, sv…) and the selector ends up neither complete
   * nor stable. Bounded by LANGUAGE_MAX_PAGES, and the caller caches the result.
   */
  async listLibraryLanguages(credentials: GraphCredentials): Promise<string[]> {
    const { accessToken } = credentials;
    const languages = new Set<string>();
    let cursor: string | undefined;
    let pages = 0;

    do {
      const response = await this.metaGraph.get<MetaGraphPagedResponse<{ language?: string }>>(
        accessToken,
        '/message_template_library',
        { fields: 'language', limit: LIBRARY_FETCH_LIMIT, ...(cursor ? { after: cursor } : {}) },
      );
      pages += 1;
      for (const item of response.data ?? []) {
        if (item.language) languages.add(item.language);
      }
      cursor = response.paging?.next ? response.paging.cursors?.after : undefined;
    } while (cursor && pages < LANGUAGE_MAX_PAGES);

    return [...languages].sort();
  }

  // Submits a template to Meta — custom content goes through review; a library reference is
  // pre-approved content and usually approves instantly
  async create(
    credentials: GraphCredentials,
    dto: CreateWhatsappTemplateDto,
  ): Promise<CreateResponseDto<WhatsappTemplateDto>> {
    const { wabaId, accessToken } = credentials;

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
  async delete(credentials: GraphCredentials, templateId: string, name: string): Promise<SuccessResponseDto> {
    const { wabaId, accessToken } = credentials;

    await this.metaGraph.delete(accessToken, `/${wabaId}/message_templates`, { hsm_id: templateId, name });

    this.logger.log(`Deleted template ${name} (${templateId}) from WABA ${wabaId}`);
    return { success: true, message: 'Template deleted successfully.' };
  }

  // Sends a real, billable template message from one of the WABA's registered numbers. Meta only
  // sends APPROVED templates and requires a value for every {{n}} body variable
  async sendTemplate(credentials: GraphCredentials, params: SendTemplateParams): Promise<string | undefined> {
    const { accessToken } = credentials;

    const components: Record<string, unknown>[] = [];
    if (params.bodyParams?.length) {
      components.push({ type: 'body', parameters: params.bodyParams.map((text) => ({ type: 'text', text })) });
      // Authentication templates carry a copy-code button whose URL is dynamic — Meta requires the
      // code repeated as that button's parameter
      if (params.category === 'AUTHENTICATION') {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: params.bodyParams[0] }],
        });
      }
    }

    const response = await this.metaGraph.post<{ messages?: { id?: string }[] }>(
      accessToken,
      `/${params.senderPhoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: params.language },
          ...(components.length ? { components } : {}),
        },
      },
    );

    this.logger.log(
      `Sent template ${params.templateName} (${params.language}) to ${params.to} from ${params.senderPhoneNumberId}`,
    );
    return response.messages?.[0]?.id;
  }

  // Sends a template on demand from the Templates tab so an operator can see the real rendering
  async sendTest(credentials: GraphCredentials, dto: SendWhatsappTemplateTestDto): Promise<SuccessResponseDto> {
    await this.sendTemplate(credentials, {
      senderPhoneNumberId: dto.senderPhoneNumberId,
      to: dto.to,
      templateName: dto.templateName,
      language: dto.language,
      bodyParams: dto.bodyParams,
      category: dto.category,
    });
    return { success: true, message: 'Test message sent.' };
  }
}
