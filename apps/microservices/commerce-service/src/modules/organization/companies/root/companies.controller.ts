import type { CompanyDto } from '@domain/parties/dto/entity/company.dto';
import { CreateCompanyDto } from '@domain/parties/dto/request/create-company.dto';
import { UpdateCompanyDto } from '@domain/parties/dto/request/update-company.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CompaniesService } from './services/companies-root.service';

@Controller()
export class CompaniesController {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly service: CompaniesService) {}

  // Returns paginated COMPANY parties for the companies table
  @MessagePattern({ cmd: 'org.companies.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CompanyDto[]; count: number }> {
    this.logger.log('companies.table');
    return this.service.findForTable(state);
  }

  // Creates a COMPANY party, optionally with a primary address
  @MessagePattern({ cmd: 'org.companies.create' })
  async create(@Payload() dto: CreateCompanyDto): Promise<CreateResponseDto<CompanyDto>> {
    this.logger.log(`companies.create — displayName: ${dto.displayName}`);
    return this.service.create(dto);
  }

  // Finds a company by ID
  @MessagePattern({ cmd: 'org.companies.findById' })
  async findById(@Payload() data: { id: string }): Promise<CompanyDto> {
    this.logger.log(`companies.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a company by ID, upserting its primary address when address fields are supplied
  @MessagePattern({ cmd: 'org.companies.update' })
  async update(@Payload() dto: UpdateCompanyDto): Promise<SuccessResponseDto> {
    this.logger.log(`companies.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Deletes a company by ID
  @MessagePattern({ cmd: 'org.companies.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
