import { SmsProviderTemplatesDomainService } from '@domain/sms-provider-templates/services/sms-provider-templates.service';
import type { SmsProviderDto } from '@domain/sms-providers/dto/entity/sms-provider.dto';
import type { CreateSmsProviderDto } from '@domain/sms-providers/dto/request/create-sms-provider.dto';
import type { UpdateSmsProviderDto } from '@domain/sms-providers/dto/request/update-sms-provider.dto';
import type { SmsProviderCapabilities } from '@domain/sms-providers/services/sms-provider-transports';
import { SmsProvidersDomainService } from '@domain/sms-providers/services/sms-providers.service';
import { Injectable, Logger } from '@nestjs/common';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';

/**
 * The organization surface for provider rows.
 *
 * Everything here passes straight through to the domain except `delete`, which spans two domains:
 * there are no foreign keys anywhere in this schema, so nothing cascades on its own and a removed
 * provider would leave its template rows behind.
 */
@Injectable()
export class SmsProvidersService {
  private readonly logger = new Logger(SmsProvidersService.name);

  constructor(
    private readonly providersService: SmsProvidersDomainService,
    private readonly templatesService: SmsProviderTemplatesDomainService,
  ) {}

  listAvailable(): SmsProviderCapabilities[] {
    return this.providersService.listAvailable();
  }

  findForTable(state: TableViewState): Promise<{ result: SmsProviderDto[]; count: number }> {
    return this.providersService.findForTable(state);
  }

  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.providersService.findForSelect(query);
  }

  findById(id: string): Promise<SmsProviderDto> {
    return this.providersService.findById(id);
  }

  create(data: CreateSmsProviderDto): Promise<CreateResponseDto<SmsProviderDto>> {
    return this.providersService.create(data);
  }

  update(id: string, data: Omit<UpdateSmsProviderDto, 'id'>): Promise<SuccessResponseDto> {
    return this.providersService.update(id, data);
  }

  // Provider first: it is the call that validates (missing row, platform row) and throws, so a
  // refused delete leaves both tables untouched. The reverse order could strip the templates off a
  // provider that then refuses to be deleted.
  async delete(id: string): Promise<SuccessResponseDto> {
    const result = await this.providersService.delete(id);
    await this.templatesService.deleteForProvider(id);

    this.logger.log(`Removed SMS provider ${id} and its templates`);
    return result;
  }
}
