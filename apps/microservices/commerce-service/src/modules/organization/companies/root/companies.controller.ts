import type { PartyDto } from '@domain/parties/dto/entity/party.dto';
import { PartiesService } from '@domain/parties/services/parties.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { PartyTypeValues } from '@/db/schema';
import { CreateCompanyDto } from './dto/request/create-company.dto';
import { UpdateCompanyDto } from './dto/request/update-company.dto';

@Controller()
export class CompaniesController {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly service: PartiesService) {}

  // Returns paginated ORGANIZATION parties for the companies table
  @MessagePattern({ cmd: 'org.companies.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PartyDto[]; count: number }> {
    this.logger.log('companies.table');
    return this.service.findForTable(state, PartyTypeValues.ORGANIZATION);
  }

  // Creates an ORGANIZATION party
  @MessagePattern({ cmd: 'org.companies.create' })
  async create(@Payload() dto: CreateCompanyDto): Promise<CreateResponseDto<PartyDto>> {
    this.logger.log(`companies.create — displayName: ${dto.displayName}`);
    return this.service.create({
      partyType: PartyTypeValues.ORGANIZATION,
      displayName: dto.displayName,
      legalName: dto.legalName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      website: dto.website,
      jurisdictionId: dto.jurisdictionId,
      isActive: dto.isActive,
    });
  }

  // Finds a company by ID
  @MessagePattern({ cmd: 'org.companies.findById' })
  async findById(@Payload() data: { id: string }): Promise<PartyDto> {
    this.logger.log(`companies.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a company by ID
  @MessagePattern({ cmd: 'org.companies.update' })
  async update(@Payload() dto: UpdateCompanyDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a company by ID
  @MessagePattern({ cmd: 'org.companies.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
