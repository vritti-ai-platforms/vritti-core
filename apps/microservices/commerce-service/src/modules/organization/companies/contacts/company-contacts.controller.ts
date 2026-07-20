import type { PartyContactDto } from '@domain/party-contacts/dto/entity/party-contact.dto';
import { CreateCompanyContactDto } from '@domain/party-contacts/dto/request/create-company-contact.dto';
import { UpdateCompanyContactDto } from '@domain/party-contacts/dto/request/update-company-contact.dto';
import { PartyContactsDomainService } from '@domain/party-contacts/services/party-contacts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CompanyContactsController {
  private readonly logger = new Logger(CompanyContactsController.name);

  constructor(private readonly service: PartyContactsDomainService) {}

  // Returns the paginated contacts of a company
  @MessagePattern({ cmd: 'org.companies.contacts.table' })
  table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyContactDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.contacts.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Creates a contact for a company
  @MessagePattern({ cmd: 'org.companies.contacts.create' })
  create(@Payload() dto: CreateCompanyContactDto): Promise<CreateResponseDto<PartyContactDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.contacts.create — companyId: ${companyId}, purpose: ${dto.purpose}`);
    return this.service.create(companyId, payload);
  }

  // Updates a contact by ID
  @MessagePattern({ cmd: 'org.companies.contacts.update' })
  update(@Payload() dto: UpdateCompanyContactDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.contacts.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a contact by ID
  @MessagePattern({ cmd: 'org.companies.contacts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.contacts.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
