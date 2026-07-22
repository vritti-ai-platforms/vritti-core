import type { PersonDto } from '@domain/parties/dto/entity/person.dto';
import type { CreatePersonDto } from '@domain/parties/dto/request/create-person.dto';
import type { UpdatePersonDto } from '@domain/parties/dto/request/update-person.dto';
import { PartiesDomainService } from '@domain/parties/services/parties.service';
import { PartyAddressesDomainService } from '@domain/party-addresses/services/party-addresses.service';
import { PartyIdentifiersDomainService } from '@domain/party-identifiers/services/party-identifiers.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { PartyTypeValues } from '@/db/schema';

@Injectable()
export class PeopleService {
  constructor(
    private readonly partiesService: PartiesDomainService,
    private readonly identifiersService: PartyIdentifiersDomainService,
    private readonly addressesService: PartyAddressesDomainService,
  ) {}

  // Returns paginated PERSON parties for the people table
  findForTable(state: TableViewState): Promise<{ result: PersonDto[]; count: number }> {
    return this.partiesService.findPeopleForTable(state);
  }

  // Creates a PERSON party (display name derived from first/last) with an optional primary identifier
  async create(dto: CreatePersonDto): Promise<CreateResponseDto<PersonDto>> {
    const result = await this.partiesService.createPerson({
      partyType: PartyTypeValues.PERSON,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      isActive: dto.isActive,
    });
    if (dto.identifierType && dto.identifierValue) {
      await this.identifiersService.add(result.data.id, {
        idType: dto.identifierType,
        idValue: dto.identifierValue,
        isPrimary: true,
      });
    }
    if (dto.address) {
      await this.addressesService.upsertPrimary(result.data.id, { ...dto.address });
    }
    return result;
  }

  // Finds a person by ID
  findById(id: string): Promise<PersonDto> {
    return this.partiesService.findPersonById(id);
  }

  // Updates a person by ID
  update(dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    return this.partiesService.update(id, payload);
  }

  // Deletes a person by ID
  delete(id: string): Promise<SuccessResponseDto> {
    return this.partiesService.delete(id);
  }
}
