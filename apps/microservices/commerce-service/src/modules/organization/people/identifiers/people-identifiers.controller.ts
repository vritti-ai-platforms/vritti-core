import { PartyIdentifierDto } from '@domain/party-identifiers/dto/entity/party-identifier.dto';
import { AddPersonIdentifierDto } from '@domain/party-identifiers/dto/request/add-person-identifier.dto';
import { PartyIdentifiersDomainService } from '@domain/party-identifiers/services/party-identifiers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleIdentifiersController {
  private readonly logger = new Logger(PeopleIdentifiersController.name);

  constructor(private readonly service: PartyIdentifiersDomainService) {}

  // Returns the paginated identifiers of a person
  @MessagePattern({ cmd: 'org.people.identifiers.table' })
  async table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartyIdentifierDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.identifiers.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Adds an identifier to a person
  @MessagePattern({ cmd: 'org.people.identifiers.add' })
  async add(@Payload() dto: AddPersonIdentifierDto): Promise<CreateResponseDto<PartyIdentifierDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.identifiers.add — personId: ${personId}`);
    return this.service.add(personId, payload);
  }

  // Removes an identifier by ID
  @MessagePattern({ cmd: 'org.people.identifiers.remove' })
  async remove(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.identifiers.remove — id: ${data.id}`);
    return this.service.remove(data.id);
  }
}
