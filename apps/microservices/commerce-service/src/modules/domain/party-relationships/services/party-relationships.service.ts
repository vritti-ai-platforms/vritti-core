import { PartyFunctionsDomainService } from '@domain/party-functions/services/party-functions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type PartyFunctionType, parties, partyRelationships } from '@/db/schema';
import { PartyRelationshipDto } from '../dto/entity/party-relationship.dto';
import { PersonCompanyDto } from '../dto/entity/person-company.dto';
import type { AddCompanyPersonDto } from '../dto/request/add-company-person.dto';
import type { UpdateCompanyPersonDto } from '../dto/request/update-company-person.dto';
import { PartyRelationshipsDomainRepository } from '../repositories/party-relationships.repository';

@Injectable()
export class PartyRelationshipsDomainService {
  private readonly logger = new Logger(PartyRelationshipsDomainService.name);

  private static readonly RELATIONSHIP_FIELD_MAP: FieldMap = {
    childName: { column: parties.displayName, type: 'string' },
    jobTitle: { column: partyRelationships.jobTitle, type: 'string' },
  };

  private static readonly COMPANY_FIELD_MAP: FieldMap = {
    companyName: { column: parties.displayName, type: 'string' },
    jobTitle: { column: partyRelationships.jobTitle, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyRelationshipsDomainRepository,
    private readonly functionsService: PartyFunctionsDomainService,
  ) {}

  // Returns paginated companies a person party is linked to for the data table
  async findCompaniesForPerson(
    personId: string,
    state: TableViewState,
  ): Promise<{ result: PersonCompanyDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyRelationshipsDomainService.COMPANY_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyRelationshipsDomainService.COMPANY_FIELD_MAP);
    const where = and(eq(partyRelationships.childPartyId, personId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyRelationshipsDomainService.COMPANY_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findCompaniesForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(partyRelationships.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PersonCompanyDto.from(row, row.companyName)), count };
  }

  // Returns paginated people linked to a company party for the data table
  async findRelationshipsForTable(
    companyPartyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyRelationshipDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(
      state.filters,
      PartyRelationshipsDomainService.RELATIONSHIP_FIELD_MAP,
    );
    const searchWhere = FilterProcessor.buildSearch(
      state.search,
      PartyRelationshipsDomainService.RELATIONSHIP_FIELD_MAP,
    );
    const where = and(eq(partyRelationships.parentPartyId, companyPartyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyRelationshipsDomainService.RELATIONSHIP_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findRelationshipsForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(partyRelationships.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PartyRelationshipDto.from(row)), count };
  }

  // Returns paginated relationship (person) options of a company party for select dropdowns —
  // optionally filtered to holders of a function (e.g. ORDER for the order-contact picker)
  findForSelect(
    query: SelectOptionsQueryDto,
    partyId: string,
    functionCode?: PartyFunctionType,
  ): Promise<SelectQueryResult> {
    return this.repository.findOptionsForSelect(partyId, query, functionCode);
  }

  // Links a person party to a company party, syncing the relationship's contact functions in one transaction
  async addRelationship(
    companyPartyId: string,
    data: Omit<AddCompanyPersonDto, 'companyId'>,
  ): Promise<CreateResponseDto<PartyRelationshipDto>> {
    await this.requirePartyExists(companyPartyId);
    await this.requirePartyExists(data.childPartyId, 'Person not found.');

    const { functions, ...relationship } = data;
    const entity = await this.database.runInTransaction(async () => {
      const created = await this.repository.addRelationship({
        parentPartyId: companyPartyId,
        childPartyId: relationship.childPartyId,
        jobTitle: relationship.jobTitle ?? null,
        isActive: relationship.isActive ?? true,
      });
      if (functions?.length) {
        await this.functionsService.syncEntityFunctions({
          partyId: companyPartyId,
          target: { relationshipId: created.id },
          functions,
        });
      }
      return created;
    });

    this.logger.log(`Added relationship: company ${companyPartyId} -> person ${data.childPartyId}`);
    return { success: true, message: 'Person added successfully.', data: PartyRelationshipDto.from(entity) };
  }

  // Updates a company-person relationship and re-syncs its contact functions in one transaction
  async updateRelationship(id: string, data: Omit<UpdateCompanyPersonDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findRelationshipById(id);
    if (!existing) throw new NotFoundException('Relationship not found.');

    const { functions, ...relationship } = data;
    await this.database.runInTransaction(async () => {
      if (Object.keys(relationship).length > 0) await this.repository.updateRelationship(id, relationship);
      if (functions) {
        await this.functionsService.syncEntityFunctions({
          partyId: existing.parentPartyId,
          target: { relationshipId: id },
          functions,
        });
      }
    });

    this.logger.log(`Updated relationship: ${id}`);
    return { success: true, message: 'Person updated successfully.' };
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
