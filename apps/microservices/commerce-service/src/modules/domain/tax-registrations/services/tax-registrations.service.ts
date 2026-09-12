import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
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
    legalEntityId: { column: taxRegistrations.legalEntityId, type: 'string' },
    jurisdictionId: { column: taxRegistrations.jurisdictionId, type: 'string' },
    isActive: { column: taxRegistrations.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: TaxRegistrationsDomainRepository) {}

  async findForTable(state: TableViewState): Promise<{ result: TaxRegistrationDto[]; count: number }> {
    const where = and(
      FilterProcessor.buildWhere(state.filters, TaxRegistrationsDomainService.FILTER_FIELD_MAP),
      FilterProcessor.buildSearch(state.search, TaxRegistrationsDomainService.SEARCH_FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...TaxRegistrationsDomainService.SEARCH_FIELD_MAP,
      ...TaxRegistrationsDomainService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: (where as SQL) || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [asc(taxRegistrations.registrationNumber)],
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

  async create(data: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationDto>> {
    await this.assertNumberFree(data.registrationNumber);

    const created = await this.repository.create({
      ...(data.legalEntityId ? { legalEntityId: data.legalEntityId } : {}),
      jurisdictionId: data.jurisdictionId,
      registrationNumber: data.registrationNumber,
      registrationType: data.registrationType,
      isPrimary: data.isPrimary ?? false,
    });
    if (created.isPrimary) await this.repository.clearPrimary(created.legalEntityId, created.id);

    this.logger.log(`Registered ${data.registrationNumber} for legal entity ${data.legalEntityId}`);
    return {
      success: true,
      message: `"${data.registrationNumber}" added.`,
      data: await this.findById(created.id),
    };
  }

  async update(id: string, data: UpdateTaxRegistrationDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax registration not found.');
    if (data.registrationNumber && data.registrationNumber !== existing.registrationNumber) {
      await this.assertNumberFree(data.registrationNumber);
    }

    await this.repository.update(id, data);
    if (data.isPrimary) await this.repository.clearPrimary(existing.legalEntityId, id);

    return { success: true, message: `"${data.registrationNumber ?? existing.registrationNumber}" updated.` };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tax registration not found.');
    await this.repository.delete(id);
    return { success: true, message: `"${existing.registrationNumber}" removed.` };
  }

  // The number is unique per organization, so a clash is reported before the constraint fires
  private async assertNumberFree(registrationNumber: string): Promise<void> {
    const clash = await this.repository.findByNumber(registrationNumber);
    if (clash) {
      throw new ConflictException({
        label: 'Already Registered',
        detail: `"${registrationNumber}" is already recorded against a legal entity in this organization.`,
        errors: [{ field: 'registrationNumber', message: 'Already in use' }],
      });
    }
  }
}
