import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { majorToMinor } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO, parseISO, subDays } from 'date-fns';
import { taxClasses, taxClassGroups, taxGroups } from '@/db/schema';
import { TaxClassGroupDto } from '../dto/entity/tax-class-group.dto';
import type { CreateTaxClassGroupDto } from '../dto/request/create-tax-class-group.dto';
import type { UpdateTaxClassGroupDto } from '../dto/request/update-tax-class-group.dto';
import type { UpdateTaxClassGroupOnClassDto } from '../dto/request/update-tax-class-group-on-class.dto';
import { TaxClassGroupsDomainRepository } from '../repositories/tax-class-groups.repository';
import { TaxGroupsDomainRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxClassGroupsDomainService {
  private readonly logger = new Logger(TaxClassGroupsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    taxClassName: { column: taxClasses.name, type: 'string' },
    taxClassCode: { column: taxClasses.code, type: 'string' },
    validFrom: { column: taxClassGroups.validFrom, type: 'string' },
    validTo: { column: taxClassGroups.validTo, type: 'string' },
  };

  // Search runs ILIKE, which dates don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    taxClassName: TaxClassGroupsDomainService.FIELD_MAP.taxClassName,
    taxClassCode: TaxClassGroupsDomainService.FIELD_MAP.taxClassCode,
  };

  private static readonly CLASS_FIELD_MAP: FieldMap = {
    taxGroupName: { column: taxGroups.name, type: 'string' },
    taxGroupCode: { column: taxGroups.code, type: 'string' },
    validFrom: { column: taxClassGroups.validFrom, type: 'string' },
    validTo: { column: taxClassGroups.validTo, type: 'string' },
  };

  private static readonly CLASS_SEARCH_FIELD_MAP: FieldMap = {
    taxGroupName: TaxClassGroupsDomainService.CLASS_FIELD_MAP.taxGroupName,
    taxGroupCode: TaxClassGroupsDomainService.CLASS_FIELD_MAP.taxGroupCode,
  };

  constructor(
    private readonly groupsRepository: TaxGroupsDomainRepository,
    private readonly repository: TaxClassGroupsDomainRepository,
  ) {}

  // Returns the paginated class mappings of a group, latest period first
  async findForTable(taxGroupId: string, state: TableState): Promise<{ result: TaxClassGroupDto[]; count: number }> {
    const group = await this.groupsRepository.findByIdOrThrow(taxGroupId);
    const fieldMap = TaxClassGroupsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findDetailsForTable({
      where: and(
        eq(taxClassGroups.taxGroupId, group.id),
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, TaxClassGroupsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxClasses.name), desc(taxClassGroups.validFrom)],
      limit,
      offset,
    });
    return { result: result.map(TaxClassGroupDto.from), count };
  }

  // Returns the paginated group mappings of a class in the context's country, latest period first — no country, no rows
  async findForClassTable(
    taxClassId: string,
    state: TableState,
  ): Promise<{ result: TaxClassGroupDto[]; count: number }> {
    const taxClass = await this.repository.findParentClassOrThrow(taxClassId);
    const country = state.filters.context.find((condition) => condition.field === 'country');
    if (country?.operator !== 'equals' || typeof country.value !== 'string') return { result: [], count: 0 };
    const fieldMap = TaxClassGroupsDomainService.CLASS_FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findDetailsForTable({
      where: and(
        eq(taxClassGroups.taxClassId, taxClass.id),
        eq(taxClassGroups.countryCode, country.value),
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, TaxClassGroupsDomainService.CLASS_SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(taxClassGroups.validFrom), asc(taxGroups.name)],
      limit,
      offset,
    });
    return { result: result.map(TaxClassGroupDto.from), count };
  }

  // Maps a tax class to a group in the group's country for a period, optionally only up to a unit price; it overlaps
  // no other mapping of the same class and price limit in that country — except an open-ended mapping that started
  // earlier, which the new mapping takes over from the day it starts
  async create(data: CreateTaxClassGroupDto): Promise<CreateResponseDto<TaxClassGroupDto>> {
    const group = await this.groupsRepository.findByIdOrThrow(data.taxGroupId);
    const taxClass = await this.repository.findClassOrThrow(data.taxClassId);
    const slot = {
      countryCode: group.countryCode,
      taxClassId: taxClass.id,
      maxUnitPrice: data.maxUnitPrice
        ? majorToMinor(data.maxUnitPrice.value, data.maxUnitPrice.currency, 'maxUnitPrice')
        : null,
      validFrom: data.validFrom,
      validTo: data.validTo ?? null,
    };
    this.repository.assertValid(slot);
    const superseded = await this.repository.findSupersededOpenEnded(slot);
    await this.repository.assertPeriodFree(slot, superseded?.id);
    const supersededEndsOn = formatISO(subDays(parseISO(slot.validFrom), 1), { representation: 'date' });

    const created = await this.repository.transaction(async () => {
      if (superseded) await this.repository.update(superseded.id, { validTo: supersededEndsOn });
      return this.repository.create({
        ...slot,
        taxGroupId: group.id,
        currencyCode: data.maxUnitPrice?.currency ?? null,
      });
    });
    this.logger.log(`Mapped tax class ${taxClass.code} to tax group ${group.code} in ${group.countryCode}`);
    return {
      success: true,
      message: superseded
        ? `"${taxClass.name}" mapped to "${group.name}" in ${group.countryCode}. The previous mapping now ends on ${supersededEndsOn}.`
        : `"${taxClass.name}" mapped to "${group.name}" in ${group.countryCode}.`,
      data: TaxClassGroupDto.from(await this.repository.findDetailOrThrow(created.id)),
    };
  }

  // Updates a class mapping, checking its resulting class, price limit and period as a whole; its country stays the
  // group's
  async update(data: UpdateTaxClassGroupDto): Promise<SuccessResponseDto> {
    const group = await this.groupsRepository.findByIdOrThrow(data.taxGroupId);
    const existing = await this.repository.findByIdOrThrow(group.id, data.id);
    const taxClass = await this.repository.findClassOrThrow(data.taxClassId ?? existing.taxClassId);
    const slot = {
      countryCode: group.countryCode,
      taxClassId: taxClass.id,
      maxUnitPrice:
        data.maxUnitPrice === undefined
          ? existing.maxUnitPrice
          : data.maxUnitPrice && majorToMinor(data.maxUnitPrice.value, data.maxUnitPrice.currency, 'maxUnitPrice'),
      validFrom: data.validFrom ?? existing.validFrom,
      validTo: data.validTo === undefined ? existing.validTo : data.validTo,
    };
    this.repository.assertValid(slot);
    await this.repository.assertPeriodFree(slot, existing.id);

    await this.repository.update(existing.id, {
      ...slot,
      currencyCode: data.maxUnitPrice === undefined ? existing.currencyCode : (data.maxUnitPrice?.currency ?? null),
    });
    this.logger.log(`Updated tax class mapping ${existing.id} on tax group ${group.code}`);
    return { success: true, message: `Mapping of "${taxClass.name}" to "${group.name}" updated.` };
  }

  // Removes a class mapping from a group
  async delete(taxGroupId: string, id: string): Promise<SuccessResponseDto> {
    const group = await this.groupsRepository.findByIdOrThrow(taxGroupId);
    await this.repository.deleteOrThrow(group.id, id);
    this.logger.log(`Deleted tax class mapping ${id} from tax group ${group.code}`);
    return { success: true, message: `Class mapping removed from "${group.name}".` };
  }

  // Updates a mapping of a class through its group; neither the class nor the group changes
  async updateOnClass(data: UpdateTaxClassGroupOnClassDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findOnClassOrThrow(data.taxClassId, data.id);
    return this.update({
      id: existing.id,
      taxGroupId: existing.taxGroupId,
      maxUnitPrice: data.maxUnitPrice,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
  }

  // Removes a mapping of a class from its group
  async deleteOnClass(taxClassId: string, id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findOnClassOrThrow(taxClassId, id);
    return this.delete(existing.taxGroupId, existing.id);
  }
}
