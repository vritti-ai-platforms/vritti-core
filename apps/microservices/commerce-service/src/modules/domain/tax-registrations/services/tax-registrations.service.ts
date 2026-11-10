import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TablePageRequest } from '@vritti/api-sdk/data-table';
import { and, asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { taxRegistrations } from '@/db/schema';
import { TaxRegistrationDto } from '../dto/entity/tax-registration.dto';
import type { CreateTaxRegistrationDto } from '../dto/request/create-tax-registration.dto';
import type { UpdateTaxRegistrationDto } from '../dto/request/update-tax-registration.dto';
import { TaxRegistrationsDomainRepository } from '../repositories/tax-registrations.repository';

@Injectable()
export class TaxRegistrationsDomainService {
  private readonly logger = new Logger(TaxRegistrationsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    registrationNumber: { column: taxRegistrations.registrationNumber, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    countryCode: { column: taxRegistrations.countryCode, type: 'string' },
    jurisdictionId: { column: taxRegistrations.jurisdictionId, type: 'string' },
    isActive: { column: taxRegistrations.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: TaxRegistrationsDomainRepository) {}

  // Returns a page of registrations, limited to one legal entity when the caller names it
  async findForTable(
    page: TablePageRequest,
    legalEntityId?: string,
  ): Promise<{ result: TaxRegistrationDto[]; count: number }> {
    const where = and(
      legalEntityId ? eq(taxRegistrations.legalEntityId, legalEntityId) : undefined,
      FilterProcessor.buildWhere(page.filters, TaxRegistrationsDomainService.FILTER_FIELD_MAP),
      FilterProcessor.buildSearch(page.search, TaxRegistrationsDomainService.SEARCH_FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(page.sort, {
      ...TaxRegistrationsDomainService.SEARCH_FIELD_MAP,
      ...TaxRegistrationsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = page.pagination;

    const { result, count } = await this.repository.findForTable({
      where: (where as SQL) || undefined,
      orderBy:
        orderBy.length > 0 ? orderBy : [asc(taxRegistrations.countryCode), asc(taxRegistrations.registrationNumber)],
      limit,
      offset,
    });
    return { result: result.map(TaxRegistrationDto.from), count };
  }

  async listByLegalEntity(legalEntityId?: string): Promise<TaxRegistrationDto[]> {
    const rows = await this.repository.findByLegalEntity(legalEntityId);
    return rows.map(TaxRegistrationDto.from);
  }

  async listAll(): Promise<TaxRegistrationDto[]> {
    const rows = await this.repository.findAllInOrg();
    return rows.map(TaxRegistrationDto.from);
  }

  async findById(id: string): Promise<TaxRegistrationDto> {
    const row = await this.repository.findByIdWithJurisdiction(id);
    if (!row) throw new NotFoundException('Tax registration not found.');
    return TaxRegistrationDto.from(row);
  }

  // Adds a registration for a country and, optionally, one of its jurisdictions; a GSTIN must name a state
  async create(data: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationDto>> {
    const registration = { ...data, jurisdictionId: data.jurisdictionId ?? null };
    const jurisdiction = await this.repository.findJurisdictionOrThrow(registration);
    await this.repository.assertNoConflicts(registration, jurisdiction);

    const created = await this.repository.create({
      ...(data.legalEntityId ? { legalEntityId: data.legalEntityId } : {}),
      countryCode: data.countryCode,
      jurisdictionId: registration.jurisdictionId,
      registrationNumber: data.registrationNumber,
      registrationType: data.registrationType,
      isPrimary: data.isPrimary ?? false,
    });
    if (created.isPrimary) await this.repository.clearPrimary(created.legalEntityId, created.id);

    this.logger.log(`Registered ${data.registrationNumber} for legal entity ${created.legalEntityId}`);
    return {
      success: true,
      message: `"${data.registrationNumber}" added.`,
      data: await this.findById(created.id),
    };
  }

  // Updates a registration, checking its resulting country, jurisdiction and number as a whole
  async update(id: string, data: UpdateTaxRegistrationDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdOrThrow(id);
    const registration = {
      legalEntityId: existing.legalEntityId,
      countryCode: data.countryCode ?? existing.countryCode,
      jurisdictionId: data.jurisdictionId === undefined ? existing.jurisdictionId : data.jurisdictionId,
      registrationNumber: data.registrationNumber ?? existing.registrationNumber,
      registrationType: data.registrationType ?? existing.registrationType,
    };
    const jurisdiction = await this.repository.findJurisdictionOrThrow(registration);
    await this.repository.assertNoConflicts(registration, jurisdiction, id);

    await this.repository.update(id, data);
    if (data.isPrimary) await this.repository.clearPrimary(existing.legalEntityId, id);

    return { success: true, message: `"${registration.registrationNumber}" updated.` };
  }

  // Removes a registration
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdOrThrow(id);
    await this.repository.delete(id);
    return { success: true, message: `"${existing.registrationNumber}" removed.` };
  }
}
