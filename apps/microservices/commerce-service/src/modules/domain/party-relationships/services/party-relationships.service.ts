import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { parties, partyRelationships } from '@/db/schema';
import { PartyRelationshipDto } from '../dto/entity/party-relationship.dto';
import { PersonCompanyDto } from '../dto/entity/person-company.dto';
import { PartyRelationshipsRepository } from '../repositories/party-relationships.repository';

export interface AddRelationshipInput {
  childPartyId: string;
  jobTitle?: string | null;
  secondaryPhone?: string | null;
  secondaryEmail?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

@Injectable()
export class PartyRelationshipsService {
  private readonly logger = new Logger(PartyRelationshipsService.name);

  private static readonly RELATIONSHIP_FIELD_MAP: FieldMap = {
    childName: { column: parties.displayName, type: 'string' },
    jobTitle: { column: partyRelationships.jobTitle, type: 'string' },
    isPrimary: { column: partyRelationships.isPrimary, type: 'boolean' },
  };

  private static readonly COMPANY_FIELD_MAP: FieldMap = {
    companyName: { column: parties.displayName, type: 'string' },
    jobTitle: { column: partyRelationships.jobTitle, type: 'string' },
    isPrimary: { column: partyRelationships.isPrimary, type: 'boolean' },
  };

  constructor(private readonly repository: PartyRelationshipsRepository) {}

  // Returns paginated companies a person party is linked to for the data table
  async findCompaniesForPerson(
    personId: string,
    state: TableViewState,
  ): Promise<{ result: PersonCompanyDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyRelationshipsService.COMPANY_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyRelationshipsService.COMPANY_FIELD_MAP);
    const where = and(eq(partyRelationships.childPartyId, personId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyRelationshipsService.COMPANY_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findCompaniesForTable({
      where,
      orderBy:
        orderBy.length > 0 ? orderBy : [desc(partyRelationships.isPrimary), asc(partyRelationships.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PersonCompanyDto.from(row, row.companyName, row.countryCode)), count };
  }

  // Returns paginated people linked to a company party for the data table
  async findRelationshipsForTable(
    companyPartyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyRelationshipDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyRelationshipsService.RELATIONSHIP_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyRelationshipsService.RELATIONSHIP_FIELD_MAP);
    const where = and(eq(partyRelationships.parentPartyId, companyPartyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyRelationshipsService.RELATIONSHIP_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findRelationshipsForTable({
      where,
      orderBy:
        orderBy.length > 0 ? orderBy : [desc(partyRelationships.isPrimary), asc(partyRelationships.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PartyRelationshipDto.from(row, row.childName)), count };
  }

  // Links a person party to a company party
  async addRelationship(
    companyPartyId: string,
    data: AddRelationshipInput,
  ): Promise<CreateResponseDto<PartyRelationshipDto>> {
    await this.requirePartyExists(companyPartyId);
    await this.requirePartyExists(data.childPartyId, 'Person not found.');

    const entity = await this.repository.addRelationship({
      parentPartyId: companyPartyId,
      childPartyId: data.childPartyId,
      jobTitle: data.jobTitle ?? null,
      secondaryPhone: data.secondaryPhone ?? null,
      secondaryEmail: data.secondaryEmail ?? null,
      isPrimary: data.isPrimary ?? false,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Added relationship: company ${companyPartyId} -> person ${data.childPartyId}`);
    return { success: true, message: 'Person added successfully.', data: PartyRelationshipDto.from(entity) };
  }

  // Removes a company-person relationship
  async removeRelationship(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findRelationshipById(id);
    if (!existing) throw new NotFoundException('Relationship not found.');
    await this.repository.removeRelationship(id);
    this.logger.log(`Removed relationship: ${id}`);
    return { success: true, message: 'Person removed successfully.' };
  }

  // Ensures a party exists, throwing if not found
  private async requirePartyExists(id: string, message = 'Party not found.'): Promise<void> {
    const exists = await this.repository.partyExists(id);
    if (!exists) throw new NotFoundException(message);
  }
}
