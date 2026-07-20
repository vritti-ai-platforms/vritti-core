import type { PartyContactDto } from '@domain/party-contacts/dto/entity/party-contact.dto';
import { CreatePersonContactDto } from '@domain/party-contacts/dto/request/create-person-contact.dto';
import { UpdateCompanyContactDto } from '@domain/party-contacts/dto/request/update-company-contact.dto';
import { PartyContactsDomainService } from '@domain/party-contacts/services/party-contacts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleContactsController {
  private readonly logger = new Logger(PeopleContactsController.name);

  constructor(private readonly service: PartyContactsDomainService) {}

  // Returns the paginated contacts of a person
  @MessagePattern({ cmd: 'org.people.contacts.table' })
  table(@Payload() data: { personId: string } & TableViewState): Promise<{ result: PartyContactDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.contacts.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Creates a contact for a person
  @MessagePattern({ cmd: 'org.people.contacts.create' })
  create(@Payload() dto: CreatePersonContactDto): Promise<CreateResponseDto<PartyContactDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.contacts.create — personId: ${personId}, purpose: ${dto.purpose}`);
    return this.service.create(personId, payload);
  }

  // Updates a contact by ID
  @MessagePattern({ cmd: 'org.people.contacts.update' })
  update(@Payload() dto: UpdateCompanyContactDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.contacts.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a contact by ID
  @MessagePattern({ cmd: 'org.people.contacts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.contacts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
