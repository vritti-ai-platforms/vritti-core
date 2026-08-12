import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import { salesChannels } from '@/db/schema';
import { SalesChannelDto } from '../dto/entity/sales-channel.dto';
import { CreateSalesChannelDto } from '../dto/request/create-sales-channel.dto';
import { UpdateSalesChannelDto } from '../dto/request/update-sales-channel.dto';
import { SalesChannelsDomainRepository } from '../repositories/sales-channels.repository';

@Injectable()
export class SalesChannelsDomainService {
  private readonly logger = new Logger(SalesChannelsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: salesChannels.name, type: 'string' },
    code: { column: salesChannels.code, type: 'string' },
    kind: { column: salesChannels.kind, type: 'string' },
    isActive: { column: salesChannels.isActive, type: 'boolean' },
    isSystem: { column: salesChannels.isSystem, type: 'boolean' },
  };

  constructor(private readonly repository: SalesChannelsDomainRepository) {}

  // Returns paginated, filtered, and sorted sales channels for the data table
  async findForTable(state: TableViewState): Promise<{ result: SalesChannelDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SalesChannelsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SalesChannelsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SalesChannelsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(salesChannels.createdAt)],
      limit,
      offset,
    });

    const refCounts = await Promise.all(rows.map((row) => this.repository.countReferences(row.id)));
    const dtos = rows.map((row, i) => SalesChannelDto.from(row, refCounts[i] === 0 && !row.isSystem));
    return { result: dtos, count };
  }

  // Returns paginated sales-channel options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'kind',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a new sales channel, rejecting duplicate codes
  async create(data: CreateSalesChannelDto): Promise<CreateResponseDto<SalesChannelDto>> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException({
        label: 'Code already exists',
        detail: `A sales channel with code "${data.code}" already exists.`,
      });
    }

    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      kind: data.kind,
      isActive: data.isActive ?? true,
      isSystem: false,
    });

    this.logger.log(`Created sales channel: ${entity.code} (${entity.kind})`);
    return {
      success: true,
      message: `Sales channel "${entity.name}" created successfully.`,
      data: SalesChannelDto.from(entity, true),
    };
  }

  // Returns a single sales channel by ID
  async findById(id: string): Promise<SalesChannelDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Sales channel not found.');
    const refs = await this.repository.countReferences(id);
    return SalesChannelDto.from(entity, refs === 0 && !entity.isSystem);
  }

  // Updates a sales channel's name and active flag
  async update(id: string, data: Omit<UpdateSalesChannelDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Sales channel not found.');

    await this.repository.update(id, data);

    this.logger.log(`Updated sales channel: ${existing.code} (${id})`);
    return { success: true, message: `Sales channel "${data.name ?? existing.name}" updated successfully.` };
  }

  // Deletes a sales channel; rejects system rows and rows still in use
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Sales channel not found.');
    if (existing.isSystem) {
      throw new ConflictException({
        label: 'System channel',
        detail: `Cannot delete "${existing.name}" — it is reserved by the system.`,
      });
    }
    const refs = await this.repository.countReferences(id);
    if (refs > 0) {
      throw new ConflictException({
        label: 'Sales channel in use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${pluralize('record', refs, true)}.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted sales channel: ${existing.code} (${id})`);
    return { success: true, message: `Sales channel "${existing.name}" deleted successfully.` };
  }
}
