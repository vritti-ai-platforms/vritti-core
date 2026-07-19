import type { CompanyDto } from '@domain/parties/dto/entity/company.dto';
import type { CreateCompanyDto } from '@domain/parties/dto/request/create-company.dto';
import type { UpdateCompanyDto } from '@domain/parties/dto/request/update-company.dto';
import { PartiesDomainService } from '@domain/parties/services/parties.service';
import { PartyAddressesDomainService } from '@domain/party-addresses/services/party-addresses.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { PartyAddressTypeValues, PartyTypeValues } from '@/db/schema';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly partiesService: PartiesDomainService,
    private readonly addressesService: PartyAddressesDomainService,
  ) {}

  // Paginated COMPANY parties for the companies table
  findForTable(state: TableViewState): Promise<{ result: CompanyDto[]; count: number }> {
    return this.partiesService.findCompaniesForTable(state);
  }

  // Creates a COMPANY party, optionally seeding its primary address
  async create(dto: CreateCompanyDto): Promise<CreateResponseDto<CompanyDto>> {
    const result = await this.partiesService.createCompany({
      partyType: PartyTypeValues.COMPANY,
      displayName: dto.displayName,
      legalName: dto.legalName,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      jurisdictionId: dto.jurisdictionId,
      isActive: dto.isActive,
    });
    if (dto.address) {
      await this.addressesService.upsertPrimary(result.data.id, {
        type: PartyAddressTypeValues.REGISTERED,
        ...dto.address,
      });
    }
    return result;
  }

  // Company detail (includes the primary address when one exists)
  findById(id: string): Promise<CompanyDto> {
    return this.partiesService.findCompanyById(id);
  }

  // Updates a company, upserting its primary address when address fields are supplied
  async update(dto: UpdateCompanyDto): Promise<SuccessResponseDto> {
    const { id, address, ...payload } = dto;
    const result = await this.partiesService.update(id, payload);
    if (address) {
      await this.addressesService.upsertPrimary(id, { type: PartyAddressTypeValues.REGISTERED, ...address });
    }
    return result;
  }

  // Deletes a company by ID
  delete(id: string): Promise<SuccessResponseDto> {
    return this.partiesService.delete(id);
  }
}
