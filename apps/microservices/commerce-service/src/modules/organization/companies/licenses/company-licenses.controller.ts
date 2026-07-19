import type { PartyLicenseDto } from '@domain/party-licenses/dto/entity/party-license.dto';
import { CreateCompanyLicenseDto } from '@domain/party-licenses/dto/request/create-company-license.dto';
import { UpdateCompanyLicenseDto } from '@domain/party-licenses/dto/request/update-company-license.dto';
import { PartyLicensesDomainService } from '@domain/party-licenses/services/party-licenses.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CompanyLicensesController {
  private readonly logger = new Logger(CompanyLicensesController.name);

  constructor(private readonly service: PartyLicensesDomainService) {}

  // Returns the paginated licenses of a company
  @MessagePattern({ cmd: 'org.companies.licenses.table' })
  table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyLicenseDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.licenses.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Creates a license for a company
  @MessagePattern({ cmd: 'org.companies.licenses.create' })
  create(@Payload() dto: CreateCompanyLicenseDto): Promise<CreateResponseDto<PartyLicenseDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.licenses.create — companyId: ${companyId}`);
    return this.service.create(companyId, payload);
  }

  // Updates a license by ID
  @MessagePattern({ cmd: 'org.companies.licenses.update' })
  update(@Payload() dto: UpdateCompanyLicenseDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.licenses.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a license by ID
  @MessagePattern({ cmd: 'org.companies.licenses.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.licenses.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
