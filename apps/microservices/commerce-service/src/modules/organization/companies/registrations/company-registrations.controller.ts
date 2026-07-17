import type { PartyTaxRegistrationDto } from '@domain/parties/dto/entity/party-tax-registration.dto';
import { PartiesService } from '@domain/parties/services/parties.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CreateCompanyRegistrationDto } from './dto/request/create-company-registration.dto';
import { UpdateCompanyRegistrationDto } from './dto/request/update-company-registration.dto';

@Controller()
export class CompanyRegistrationsController {
  private readonly logger = new Logger(CompanyRegistrationsController.name);

  constructor(private readonly service: PartiesService) {}

  // Returns the paginated tax registrations of a company
  @MessagePattern({ cmd: 'org.companies.registrations.table' })
  async table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyTaxRegistrationDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.registrations.table — companyId: ${companyId}`);
    return this.service.findRegistrationsForTable(companyId, state);
  }

  // Creates a tax registration for a company
  @MessagePattern({ cmd: 'org.companies.registrations.create' })
  async create(@Payload() dto: CreateCompanyRegistrationDto): Promise<CreateResponseDto<PartyTaxRegistrationDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.registrations.create — companyId: ${companyId}`);
    return this.service.createRegistration(companyId, payload);
  }

  // Updates a tax registration by ID
  @MessagePattern({ cmd: 'org.companies.registrations.update' })
  async update(@Payload() dto: UpdateCompanyRegistrationDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.registrations.update — id: ${id}`);
    return this.service.updateRegistration(id, payload);
  }

  // Deletes a tax registration by ID
  @MessagePattern({ cmd: 'org.companies.registrations.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.registrations.delete — id: ${data.id}`);
    return this.service.deleteRegistration(data.id);
  }
}
