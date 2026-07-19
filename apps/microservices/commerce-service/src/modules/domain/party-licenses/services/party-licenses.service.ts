import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { partyLicenses } from '@/db/schema';
import { PartyLicenseDto } from '../dto/entity/party-license.dto';
import type { CreateCompanyLicenseDto } from '../dto/request/create-company-license.dto';
import type { UpdateCompanyLicenseDto } from '../dto/request/update-company-license.dto';
import { PartyLicensesDomainRepository } from '../repositories/party-licenses.repository';

@Injectable()
export class PartyLicensesDomainService {
  private readonly logger = new Logger(PartyLicensesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    licenseType: { column: partyLicenses.licenseType, type: 'string' },
    licenseNumber: { column: partyLicenses.licenseNumber, type: 'string' },
    region: { column: partyLicenses.region, type: 'string' },
    validTo: { column: partyLicenses.validTo, type: 'string' },
    isActive: { column: partyLicenses.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: PartyLicensesDomainRepository) {}

  // Returns paginated licenses of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyLicenseDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyLicensesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyLicensesDomainService.FIELD_MAP);
    const where = and(eq(partyLicenses.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyLicensesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(partyLicenses.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyLicenseDto.from), count };
  }

  // Creates a license for a party, rejecting duplicates of the same type and number
  async create(
    partyId: string,
    data: Omit<CreateCompanyLicenseDto, 'companyId'>,
  ): Promise<CreateResponseDto<PartyLicenseDto>> {
    const partyExists = await this.repository.partyExists(partyId);
    if (!partyExists) throw new NotFoundException('Party not found.');

    const existing = await this.repository.findByTypeNumber(data.licenseType, data.licenseNumber);
    if (existing) {
      throw new ConflictException({
        label: 'License Exists',
        detail: `A ${data.licenseType} license with this number is already on record.`,
      });
    }

    const entity = await this.repository.create({
      partyId,
      licenseType: data.licenseType,
      licenseNumber: data.licenseNumber,
      region: data.region ?? null,
      validTo: data.validTo ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Created ${data.licenseType} license for party ${partyId}`);
    return { success: true, message: 'License added successfully.', data: PartyLicenseDto.from(entity) };
  }

  // Updates a license, rejecting duplicates when type or number changes
  async update(id: string, data: Omit<UpdateCompanyLicenseDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('License not found.');

    if (data.licenseType !== undefined || data.licenseNumber !== undefined) {
      const licenseType = data.licenseType ?? existing.licenseType;
      const licenseNumber = data.licenseNumber ?? existing.licenseNumber;
      const duplicate = await this.repository.findByTypeNumber(licenseType, licenseNumber);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException({
          label: 'License Exists',
          detail: `A ${licenseType} license with this number is already on record.`,
        });
      }
    }

    if (Object.keys(data).length > 0) {
      await this.repository.update(id, data);
    }

    this.logger.log(`Updated license: ${id}`);
    return { success: true, message: 'License updated successfully.' };
  }

  // Deletes a license by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('License not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted license: ${id}`);
    return { success: true, message: 'License removed successfully.' };
  }
}
