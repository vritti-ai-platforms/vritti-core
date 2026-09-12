import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, FieldMap, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { FilterProcessor } from '@vritti/api-sdk/database';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { CatalogChannelTypeValues, catalogChannels } from '@/db/schema';
import { CatalogChannelDto, type CatalogChannelRow, ResolvedCatalogDto } from '../dto/entity/catalog-channel.dto';
import type {
  CreateCatalogChannelDto,
  ResolveCatalogChannelDto,
  UpdateCatalogChannelDto,
} from '../dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainRepository } from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsDomainService {
  private readonly logger = new Logger(CatalogChannelsDomainService.name);

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    type: { column: catalogChannels.type, type: 'string' },
    catalogId: { column: catalogChannels.catalogId, type: 'string' },
  };

  constructor(private readonly repository: CatalogChannelsDomainRepository) {}

  async findForTable(state: TableViewState): Promise<{ result: CatalogChannelDto[]; count: number }> {
    const where = and(FilterProcessor.buildWhere(state.filters, CatalogChannelsDomainService.FILTER_FIELD_MAP));
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CatalogChannelsDomainService.FILTER_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(catalogChannels.type)],
      limit,
      offset,
    });
    return { result: result.map((row) => CatalogChannelDto.from(row)), count };
  }

  async findByCatalog(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.findByCatalog(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  async create(data: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.assertTargetMatchesType(data);
    const created = await this.insertOrConflict(data);
    this.logger.log(`Bound ${data.type} channel to catalog ${data.catalogId}`);
    const row = await this.repository.findByIdWithRefs(created.id);
    return {
      success: true,
      message: `Channel now sells "${row?.catalogName ?? 'the catalog'}".`,
      data: CatalogChannelDto.from(row as CatalogChannelRow),
    };
  }

  // Repointing is the common edit — the scope and target are fixed once a channel exists
  async repoint(data: UpdateCatalogChannelDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(data.id);
    if (!existing) throw new NotFoundException('Channel not found.');
    const catalog = await this.repository.findCatalog(data.catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');
    await this.repository.repoint(data.id, data.catalogId);
    return { success: true, message: `Channel now sells "${catalog.name}".` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Channel not found.');
    await this.repository.deleteChannel(id);
    return { success: true, message: 'Channel removed.' };
  }

  // The caller's type comes from the API surface it authenticated against, never from the request.
  // Most specific wins: a named app or till beats a wildcard, a site beats an LE, an LE beats the org.
  async resolve(data: ResolveCatalogChannelDto): Promise<ResolvedCatalogDto> {
    const candidates = await this.repository.findCandidates(data);
    if (candidates.length === 0) throw this.unresolved(data);

    const best = candidates.sort((a, b) => this.specificity(b) - this.specificity(a))[0];
    const catalog = await this.repository.findCatalog(best.catalogId);
    if (!catalog) throw this.unresolved(data);

    const dto = new ResolvedCatalogDto();
    dto.catalogId = catalog.id;
    dto.catalogName = catalog.name;
    dto.taxInclusive = catalog.taxInclusive;
    dto.channelId = best.id;
    dto.matchedScope = best.siteId ? 'SITE' : best.legalEntityId ? 'LEGAL_ENTITY' : 'ORGANIZATION';
    dto.matchedTarget = Boolean(best.appId || best.terminalId);
    return dto;
  }

  // A named target outranks its scope, because "this till" is a deliberate exception to "any till here"
  private specificity(row: CatalogChannelRow): number {
    return (row.terminalId ? 8 : 0) + (row.appId ? 8 : 0) + (row.siteId ? 4 : 0) + (row.legalEntityId ? 2 : 0);
  }

  // An empty product list is indistinguishable from "everything is out of stock", so this fails loudly
  private unresolved(data: ResolveCatalogChannelDto) {
    return new NotFoundException({
      label: 'No Catalog For This Channel',
      detail: `No catalog is configured for ${data.type} at this scope. Add a channel pointing at one.`,
    });
  }

  private assertTargetMatchesType(data: CreateCatalogChannelDto): void {
    if (data.type === CatalogChannelTypeValues.APP && data.terminalId) {
      throw new ConflictException({ label: 'Wrong Target', detail: 'An app channel cannot name a till.' });
    }
    if (data.type === CatalogChannelTypeValues.POS && data.appId) {
      throw new ConflictException({ label: 'Wrong Target', detail: 'A POS channel cannot name an app.' });
    }
    if (data.terminalId && !data.siteId) {
      throw new ConflictException({ label: 'Outlet Required', detail: 'A till belongs to an outlet — name it too.' });
    }
    if (data.siteId && !data.legalEntityId) {
      throw new ConflictException({
        label: 'Company Required',
        detail: 'An outlet belongs to a company — name it too.',
      });
    }
  }

  private async insertOrConflict(data: CreateCatalogChannelDto) {
    try {
      return await this.repository.insertChannel({
        catalogId: data.catalogId,
        type: data.type,
        legalEntityId: data.legalEntityId ?? null,
        siteId: data.siteId ?? null,
        appId: data.appId ?? null,
        terminalId: data.terminalId ?? null,
      });
    } catch (error: unknown) {
      const candidate = error as { code?: string };
      if (candidate?.code === '23505') {
        throw new ConflictException({
          label: 'Channel Taken',
          detail: 'Another catalog already sells on this channel at this scope. Repoint that one instead.',
        });
      }
      throw error;
    }
  }
}
