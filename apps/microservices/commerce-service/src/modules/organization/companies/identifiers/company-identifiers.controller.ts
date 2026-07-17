import { PartyIdentifierDto } from '@domain/party-identifiers/dto/entity/party-identifier.dto';
import { PartyIdentifiersService } from '@domain/party-identifiers/services/party-identifiers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddCompanyIdentifierDto } from './dto/request/add-company-identifier.dto';

@Controller()
export class CompanyIdentifiersController {
  private readonly logger = new Logger(CompanyIdentifiersController.name);

  constructor(private readonly service: PartyIdentifiersService) {}

  // Returns the paginated identifiers of a company
  @MessagePattern({ cmd: 'org.companies.identifiers.table' })
  async table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyIdentifierDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.identifiers.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Adds an identifier to a company
  @MessagePattern({ cmd: 'org.companies.identifiers.add' })
  async add(@Payload() dto: AddCompanyIdentifierDto): Promise<CreateResponseDto<PartyIdentifierDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.identifiers.add — companyId: ${companyId}`);
    return this.service.add(companyId, payload);
  }

  // Removes an identifier by ID
  @MessagePattern({ cmd: 'org.companies.identifiers.remove' })
  async remove(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.identifiers.remove — id: ${data.id}`);
    return this.service.remove(data.id);
  }
}
