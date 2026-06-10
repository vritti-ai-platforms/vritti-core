import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { taxGroups } from '@/db/schema';
import type { CreateTaxGroupDto } from '@/modules/tax-groups/dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '@/modules/tax-groups/dto/request/update-tax-group.dto';
import { TaxGroupDto } from '../dto/entity/tax-group.dto';
import { TaxGroupsRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxGroupsService {
  private readonly logger = new Logger(TaxGroupsService.name);

  // Whitelist of fields the frontend may filter/search/sort on
  private static readonly FIELD_MAP: FieldMap = {
    name: { column: taxGroups.name, type: 'string' },
    isActive: { column: taxGroups.isActive, type: 'boolean' },
  };

  constructor(private readonly taxGroupsRepository: TaxGroupsRepository) {}

  // Returns a paginated page of tax groups (with rates + canDelete) for the data table
  async findForTable(state: TableViewState): Promise<{ result: TaxGroupDto[]; count: number }> {
    const where = and(
      FilterProcessor.buildWhere(state.filters, TaxGroupsService.FIELD_MAP),
      FilterProcessor.buildSearch(state.search, TaxGroupsService.FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, TaxGroupsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result: groups, count } = await this.taxGroupsRepository.findAllForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxGroups.name)],
      limit,
      offset,
    });

    const ids = groups.map((g) => g.id);
    const [ratesByGroup, referenced] = await Promise.all([
      this.taxGroupsRepository.findRatesByGroupIds(ids),
      this.taxGroupsRepository.findReferencedIds(ids),
    ]);

    return {
      result: groups.map((g) => TaxGroupDto.from(g, ratesByGroup.get(g.id) ?? [], !referenced.has(g.id))),
      count,
    };
  }

  // Returns tax groups as dropdown options (id → name), searchable + paginated
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.taxGroupsRepository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
    });
  }

  // Creates a new tax group with associated tax rates
  async create(data: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupDto>> {
    const entity = await this.taxGroupsRepository.create({
      name: data.name,
    });

    const rates = await this.taxGroupsRepository.createTaxRates(
      entity.id,
      (data.taxRates ?? []).map((r, i) => ({
        name: r.name,
        rate: r.rate,
        sortOrder: i,
      })),
    );

    this.logger.log(`Created tax group: ${entity.name} (${entity.id})`);
    return {
      success: true,
      message: `Tax group "${entity.name}" created successfully.`,
      data: TaxGroupDto.from(entity, rates),
    };
  }

  // Finds a tax group by ID with its tax rates or throws NotFoundException
  async findById(id: string): Promise<TaxGroupDto> {
    const entity = await this.taxGroupsRepository.findById(id);
    if (!entity) throw new NotFoundException('Tax group not found.');
    const rates = await this.taxGroupsRepository.findTaxRatesByGroupId(id);
    return TaxGroupDto.from(entity, rates);
  }

  // Updates a tax group and replaces its tax rates
  async update(id: string, data: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');

    const { taxRates: _taxRates, ...updatePayload } = data;
    const entity = await this.taxGroupsRepository.update(id, updatePayload);

    // Replace tax rates if provided
    if (data.taxRates !== undefined) {
      await this.taxGroupsRepository.deleteTaxRatesByGroupId(id);
      await this.taxGroupsRepository.createTaxRates(
        id,
        data.taxRates.map((r, i) => ({
          name: r.name,
          rate: r.rate,
          sortOrder: i,
        })),
      );
    }

    this.logger.log(`Updated tax group: ${entity.name} (${entity.id})`);
    return { success: true, message: `Tax group "${entity.name}" updated successfully.` };
  }

  // Deletes a tax group by ID (cascades to tax rates)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.taxGroupsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tax group not found.');
    await this.taxGroupsRepository.delete(id);
    this.logger.log(`Deleted tax group: ${existing.name} (${id})`);
    return { success: true, message: `Tax group "${existing.name}" deleted successfully.` };
  }
}
