import type { PartyDto } from '@domain/parties/dto/entity/party.dto';
import { PartiesService } from '@domain/parties/services/parties.service';
import { PartyIdentifiersService } from '@domain/party-identifiers/services/party-identifiers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { PartyTypeValues } from '@/db/schema';
import { CreatePersonDto } from './dto/request/create-person.dto';
import { UpdatePersonDto } from './dto/request/update-person.dto';

@Controller()
export class PeopleController {
  private readonly logger = new Logger(PeopleController.name);

  constructor(
    private readonly service: PartiesService,
    private readonly identifiersService: PartyIdentifiersService,
  ) {}

  // Returns paginated PERSON parties for the people table
  @MessagePattern({ cmd: 'org.people.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PartyDto[]; count: number }> {
    this.logger.log('people.table');
    return this.service.findForTable(state, PartyTypeValues.PERSON);
  }

  // Creates a PERSON party (display name derived from first/last) with an optional primary identifier
  @MessagePattern({ cmd: 'org.people.create' })
  async create(@Payload() dto: CreatePersonDto): Promise<CreateResponseDto<PartyDto>> {
    this.logger.log(`people.create — ${dto.firstName} ${dto.lastName ?? ''}`);
    const result = await this.service.create({
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

    return result;
  }

  // Finds a person by ID
  @MessagePattern({ cmd: 'org.people.findById' })
  async findById(@Payload() data: { id: string }): Promise<PartyDto> {
    this.logger.log(`people.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a person by ID
  @MessagePattern({ cmd: 'org.people.update' })
  async update(@Payload() dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a person by ID
  @MessagePattern({ cmd: 'org.people.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
