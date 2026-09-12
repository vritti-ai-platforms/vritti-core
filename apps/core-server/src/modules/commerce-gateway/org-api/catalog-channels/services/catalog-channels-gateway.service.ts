import type {
  CreateCatalogChannelDto,
  RepointCatalogChannelDto,
} from '@commerce/catalog-channels/dto/request/create-catalog-channel.dto';
import type { ResolveCatalogChannelQueryDto } from '@commerce/catalog-channels/dto/request/resolve-catalog-channel-query.dto';
import type {
  CatalogChannelResponseDto,
  ResolvedCatalogResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type { CatalogChannelTableResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

const TABLE_SLUG = 'commerce-org-catalog-channels';

@Injectable()
export class CatalogChannelsGatewayService {
  private readonly logger = new Logger(CatalogChannelsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated channel bindings for the data table
  async findForTable(userId: string): Promise<CatalogChannelTableResponseDto> {
    this.logger.log('org.catalogChannels.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, TABLE_SLUG);
    const { result, count } = await this.nats.send<{ result: CatalogChannelResponseDto[]; count: number }>(
      'commerce',
      'org.catalogChannels.table',
      state,
    );
    return { result, count, state, activeViewId };
  }

  // Every channel selling one catalog — read-only on the catalog detail
  async findByCatalog(catalogId: string): Promise<CatalogChannelResponseDto[]> {
    this.logger.log(`org.catalogChannels.byCatalog — catalogId: ${catalogId}`);
    return this.nats.send('commerce', 'org.catalogChannels.byCatalog', { catalogId });
  }

  // Diagnostic only. Real callers never pass a type — theirs is fixed by the API surface they
  // authenticated against. This one lets an operator ask "what would channel X resolve to?".
  async resolve(query: ResolveCatalogChannelQueryDto): Promise<ResolvedCatalogResponseDto> {
    this.logger.log(`org.catalogChannels.resolve — type: ${query.type}`);
    return this.nats.send('commerce', 'org.catalogChannels.resolve', query);
  }

  async create(dto: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`org.catalogChannels.create — type: ${dto.type}, catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'org.catalogChannels.create', dto);
  }

  async repoint(id: string, dto: RepointCatalogChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogChannels.repoint — id: ${id}, catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'org.catalogChannels.repoint', { id, catalogId: dto.catalogId });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.catalogChannels.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.catalogChannels.delete', { id });
  }
}
