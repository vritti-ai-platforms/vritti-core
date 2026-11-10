import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { taxGroups } from '@/db/schema';
import { TaxGroupDto } from '../dto/entity/tax-group.dto';
import type { CreateTaxGroupDto } from '../dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '../dto/request/update-tax-group.dto';
import { TaxGroupsDomainRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxGroupsDomainService {
  private readonly logger = new Logger(TaxGroupsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    country: { column: taxGroups.countryCode, type: 'string' },
    code: { column: taxGroups.code, type: 'string' },
    name: { column: taxGroups.name, type: 'string' },
    treatment: { column: taxGroups.treatment, type: 'string' },
    isActive: { column: taxGroups.isActive, type: 'boolean' },
  };

  // Search runs ILIKE, which Postgres enums (treatment) don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    code: TaxGroupsDomainService.FIELD_MAP.code,
    name: TaxGroupsDomainService.FIELD_MAP.name,
  };

  constructor(private readonly repository: TaxGroupsDomainRepository) {}

  // Returns paginated tax groups with their rate and class counts, filtered by the table's panel and context
  async findForTable(state: TableState): Promise<{ result: TaxGroupDto[]; count: number }> {
    const fieldMap = TaxGroupsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findDetailsForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, TaxGroupsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxGroups.countryCode), asc(taxGroups.name)],
      limit,
      offset,
    });
    return { result: result.map(TaxGroupDto.from), count };
  }

  // Returns tax-group options for select dropdowns, only one country's when `country` is given
  findForSelect(query: SelectOptionsQueryDto, options?: { country?: string }): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey || 'code',
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
      where: options?.country ? { countryCode: options.country } : undefined,
    });
  }

  // Returns a tax group with its rate and class counts
  async findById(id: string): Promise<TaxGroupDto> {
    return TaxGroupDto.from(await this.repository.findDetailOrThrow(id));
  }

  // Creates a tax group for one country; its code is unique within that country
  async create(data: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupDto>> {
    await this.repository.assertCodeFree(data.countryCode, data.code);
    const entity = await this.repository.create({
      countryCode: data.countryCode,
      code: data.code,
      name: data.name,
      treatment: data.treatment,
      legalText: data.legalText ?? null,
      isActive: data.isActive,
    });
    this.logger.log(`Created tax group: ${entity.countryCode} ${entity.code} (${entity.id})`);
    return {
      success: true,
      message: `Tax group "${entity.name}" created successfully.`,
      data: TaxGroupDto.from({ ...entity, rateCount: 0, classCount: 0, openClassCount: 0 }),
    };
  }

  // Updates a tax group; its country is fixed, so a new code is checked within the same country
  async update(id: string, data: Omit<UpdateTaxGroupDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdOrThrow(id);
    if (data.code !== undefined && data.code !== existing.code) {
      await this.repository.assertCodeFree(existing.countryCode, data.code, id);
    }
    await this.repository.update(id, data);
    this.logger.log(`Updated tax group: ${existing.countryCode} ${existing.code} (${id})`);
    return { success: true, message: `Tax group "${data.name ?? existing.name}" updated successfully.` };
  }

  // Activates or deactivates a tax group; one that a class mapping in force or still to come names stays active
  async setActive(id: string, isActive: boolean): Promise<SuccessResponseDto> {
    const existing = await this.repository.findDetailOrThrow(id);
    if (!isActive) this.repository.assertDeactivatable(existing);

    await this.repository.update(id, { isActive });

    this.logger.log(
      `${isActive ? 'Activated' : 'Deactivated'} tax group: ${existing.countryCode} ${existing.code} (${id})`,
    );
    return { success: true, message: `Tax group "${existing.name}" ${isActive ? 'activated' : 'deactivated'}.` };
  }

  // Deletes a tax group and its rates unless tax classes are mapped to it
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findDetailOrThrow(id);
    this.repository.assertDeletable(existing);
    await this.repository.delete(id);
    this.logger.log(`Deleted tax group: ${existing.countryCode} ${existing.code} (${id})`);
    return { success: true, message: `Tax group "${existing.name}" deleted successfully.` };
  }
}
