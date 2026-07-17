import { PartyAddressDto } from '@domain/party-addresses/dto/entity/party-address.dto';
import { PartyAddressesService } from '@domain/party-addresses/services/party-addresses.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddCompanyAddressDto } from './dto/request/add-company-address.dto';
import { UpdateAddressDto } from './dto/request/update-address.dto';

@Controller()
export class CompanyAddressesController {
  private readonly logger = new Logger(CompanyAddressesController.name);

  constructor(private readonly service: PartyAddressesService) {}

  // Returns the paginated addresses of a company
  @MessagePattern({ cmd: 'org.companies.addresses.table' })
  async table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyAddressDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.addresses.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Adds an address to a company
  @MessagePattern({ cmd: 'org.companies.addresses.add' })
  async add(@Payload() dto: AddCompanyAddressDto): Promise<CreateResponseDto<PartyAddressDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.addresses.add — companyId: ${companyId}`);
    return this.service.add(companyId, payload);
  }

  // Updates an address by ID
  @MessagePattern({ cmd: 'org.companies.addresses.update' })
  async update(@Payload() dto: UpdateAddressDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`companies.addresses.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Removes an address by ID
  @MessagePattern({ cmd: 'org.companies.addresses.remove' })
  async remove(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.addresses.remove — id: ${data.id}`);
    return this.service.remove(data.id);
  }
}
