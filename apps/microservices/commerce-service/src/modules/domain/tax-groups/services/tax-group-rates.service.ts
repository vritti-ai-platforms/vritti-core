import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { majorToMinor } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO, parseISO, subDays } from 'date-fns';
import { taxComponents, taxGroupRates, taxJurisdictions } from '@/db/schema';
import { TaxGroupRateDto } from '../dto/entity/tax-group-rate.dto';
import type { CreateTaxGroupRateDto } from '../dto/request/create-tax-group-rate.dto';
import type { UpdateTaxGroupRateDto } from '../dto/request/update-tax-group-rate.dto';
import { type TaxGroupRateContext, TaxGroupRatesDomainRepository } from '../repositories/tax-group-rates.repository';
import { TaxGroupsDomainRepository } from '../repositories/tax-groups.repository';

@Injectable()
export class TaxGroupRatesDomainService {
  private readonly logger = new Logger(TaxGroupRatesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    taxComponentName: { column: taxComponents.name, type: 'string' },
    taxComponentCode: { column: taxComponents.code, type: 'string' },
    jurisdictionName: { column: taxJurisdictions.name, type: 'string' },
    jurisdictionCheck: { column: taxGroupRates.jurisdictionCheck, type: 'string' },
    rate: { column: taxGroupRates.rate, type: 'number' },
    calculation: { column: taxGroupRates.calculation, type: 'string' },
    base: { column: taxGroupRates.base, type: 'string' },
    sequence: { column: taxGroupRates.sequence, type: 'number' },
    validFrom: { column: taxGroupRates.validFrom, type: 'string' },
    validTo: { column: taxGroupRates.validTo, type: 'string' },
  };

  // Search runs ILIKE, which Postgres enums and dates don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    taxComponentName: TaxGroupRatesDomainService.FIELD_MAP.taxComponentName,
    taxComponentCode: TaxGroupRatesDomainService.FIELD_MAP.taxComponentCode,
    jurisdictionName: TaxGroupRatesDomainService.FIELD_MAP.jurisdictionName,
  };

  constructor(
    private readonly groupsRepository: TaxGroupsDomainRepository,
    private readonly repository: TaxGroupRatesDomainRepository,
  ) {}

  // Returns a group's paginated rates in the order they apply, latest period first; a state and a day in the context
  // narrow them to the rates charged there on that day
  async findForTable(
    taxGroupId: string,
    state: TableState,
    context: TaxGroupRateContext,
  ): Promise<{ result: TaxGroupRateDto[]; count: number }> {
    const group = await this.groupsRepository.findByIdOrThrow(taxGroupId);
    const fieldMap = TaxGroupRatesDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findDetailsForTable({
      where: and(
        eq(taxGroupRates.taxGroupId, group.id),
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, TaxGroupRatesDomainService.SEARCH_FIELD_MAP),
      ),
      context,
      orderBy:
        orderBy.length > 0
          ? orderBy
          : [asc(taxGroupRates.sequence), asc(taxComponents.name), desc(taxGroupRates.validFrom)],
      limit,
      offset,
    });
    return { result: result.map(TaxGroupRateDto.from), count };
  }

  // Adds a dated rate to a group: its component and jurisdiction are of the group's country, it carries the values
  // its calculation needs, and it overlaps no other rate of the same component, place and jurisdiction check — except an
  // open-ended rate that started earlier, which the new rate takes over from the day it starts
  async create(data: CreateTaxGroupRateDto): Promise<CreateResponseDto<TaxGroupRateDto>> {
    const group = await this.groupsRepository.findByIdOrThrow(data.taxGroupId);
    const component = await this.repository.findComponentOrThrow(data.taxComponentId, group.countryCode);
    const jurisdictionId = data.jurisdictionId ?? null;
    await this.repository.findJurisdictionOrThrow(jurisdictionId, group.countryCode);

    const values = {
      calculation: data.calculation,
      rate: data.rate ?? null,
      amount: data.amount ? majorToMinor(data.amount.value, data.amount.currency, 'amount') : null,
      measure: data.measure ?? null,
      validFrom: data.validFrom,
      validTo: data.validTo ?? null,
    };
    this.repository.assertValid(values);
    const slot = {
      taxGroupId: group.id,
      taxComponentId: component.id,
      jurisdictionId,
      jurisdictionCheck: data.jurisdictionCheck ?? null,
      validFrom: values.validFrom,
      validTo: values.validTo,
    };
    const superseded = await this.repository.findSupersededOpenEnded(slot);
    await this.repository.assertPeriodFree(slot, superseded?.id);
    const supersededEndsOn = formatISO(subDays(parseISO(slot.validFrom), 1), { representation: 'date' });

    const created = await this.repository.transaction(async () => {
      if (superseded) await this.repository.update(superseded.id, { validTo: supersededEndsOn });
      return this.repository.create({
        ...slot,
        ...values,
        currencyCode: data.amount?.currency ?? null,
        base: data.base,
        sequence: data.sequence,
      });
    });
    this.logger.log(`Added ${component.code} rate to tax group ${group.code} (${created.id})`);
    return {
      success: true,
      message: superseded
        ? `${component.name} rate added to "${group.name}". The previous rate now ends on ${supersededEndsOn}.`
        : `${component.name} rate added to "${group.name}".`,
      data: TaxGroupRateDto.from(await this.repository.findDetailOrThrow(created.id)),
    };
  }

  // Updates a rate, checking its resulting component, jurisdiction, calculation and period as a whole. A rate that
  // keeps its calculation keeps the values it does not resend; one that switches calculation starts from none
  async update(data: UpdateTaxGroupRateDto): Promise<SuccessResponseDto> {
    const group = await this.groupsRepository.findByIdOrThrow(data.taxGroupId);
    const existing = await this.repository.findByIdOrThrow(group.id, data.id);
    const component = await this.repository.findComponentOrThrow(
      data.taxComponentId ?? existing.taxComponentId,
      group.countryCode,
    );
    const jurisdictionId = data.jurisdictionId === undefined ? existing.jurisdictionId : data.jurisdictionId;
    await this.repository.findJurisdictionOrThrow(jurisdictionId, group.countryCode);

    const calculation = data.calculation ?? existing.calculation;
    const kept = calculation === existing.calculation ? existing : null;
    const values = {
      calculation,
      rate: data.rate === undefined ? (kept?.rate ?? null) : data.rate,
      amount:
        data.amount === undefined
          ? (kept?.amount ?? null)
          : data.amount && majorToMinor(data.amount.value, data.amount.currency, 'amount'),
      measure: data.measure === undefined ? (kept?.measure ?? null) : data.measure,
      validFrom: data.validFrom ?? existing.validFrom,
      validTo: data.validTo === undefined ? existing.validTo : data.validTo,
    };
    this.repository.assertValid(values);
    const slot = {
      taxGroupId: group.id,
      taxComponentId: component.id,
      jurisdictionId,
      jurisdictionCheck: data.jurisdictionCheck === undefined ? existing.jurisdictionCheck : data.jurisdictionCheck,
      validFrom: values.validFrom,
      validTo: values.validTo,
    };
    await this.repository.assertPeriodFree(slot, existing.id);

    await this.repository.update(existing.id, {
      ...slot,
      ...values,
      currencyCode: data.amount === undefined ? (kept?.currencyCode ?? null) : (data.amount?.currency ?? null),
      base: data.base,
      sequence: data.sequence,
    });
    this.logger.log(`Updated ${component.code} rate on tax group ${group.code} (${existing.id})`);
    return { success: true, message: `${component.name} rate on "${group.name}" updated.` };
  }

  // Removes a rate from a group
  async delete(taxGroupId: string, id: string): Promise<SuccessResponseDto> {
    const group = await this.groupsRepository.findByIdOrThrow(taxGroupId);
    await this.repository.deleteOrThrow(group.id, id);
    this.logger.log(`Deleted rate ${id} from tax group ${group.code}`);
    return { success: true, message: `Rate removed from "${group.name}".` };
  }
}
