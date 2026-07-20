import type { PartyTaxRegistrationDto } from '@domain/parties/dto/entity/party-tax-registration.dto';
import { CreatePersonRegistrationDto } from '@domain/parties/dto/request/create-person-registration.dto';
import { UpdateCompanyRegistrationDto } from '@domain/parties/dto/request/update-company-registration.dto';
import { PartiesDomainService } from '@domain/parties/services/parties.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleRegistrationsController {
  private readonly logger = new Logger(PeopleRegistrationsController.name);

  constructor(private readonly service: PartiesDomainService) {}

  // Returns the paginated tax registrations of a person
  @MessagePattern({ cmd: 'org.people.registrations.table' })
  async table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartyTaxRegistrationDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.registrations.table — personId: ${personId}`);
    return this.service.findRegistrationsForTable(personId, state);
  }

  // Creates a tax registration for a person
  @MessagePattern({ cmd: 'org.people.registrations.create' })
  async create(@Payload() dto: CreatePersonRegistrationDto): Promise<CreateResponseDto<PartyTaxRegistrationDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.registrations.create — personId: ${personId}`);
    return this.service.createRegistration(personId, payload);
  }

  // Updates a tax registration by ID
  @MessagePattern({ cmd: 'org.people.registrations.update' })
  async update(@Payload() dto: UpdateCompanyRegistrationDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.registrations.update — id: ${id}`);
    return this.service.updateRegistration(id, payload);
  }

  // Deletes a tax registration by ID
  @MessagePattern({ cmd: 'org.people.registrations.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.registrations.delete — id: ${data.id}`);
    return this.service.deleteRegistration(data.id);
  }
}
