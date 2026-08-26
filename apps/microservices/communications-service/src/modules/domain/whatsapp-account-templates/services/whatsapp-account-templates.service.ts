import { MetaGraphHttpService } from '@domain/meta-graph/services/meta-graph-http.service';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import { Injectable } from '@nestjs/common';
import { type MetaGraphTemplate, WhatsappTemplateDto } from '../dto/entity/whatsapp-template.dto';

const TEMPLATE_FIELDS = 'id,name,status,category,language,quality_score,rejected_reason';

// One page covers every realistic WABA today; Graph paging support is deferred until an account
// actually outgrows it
const TEMPLATE_PAGE_LIMIT = 100;

// Message templates are read live from Meta — the WABA is the source of truth for review status
// and quality, so nothing is persisted here (see the communications-permissions note)
@Injectable()
export class WhatsappAccountTemplatesDomainService {
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
}
