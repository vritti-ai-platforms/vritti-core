import type { PartyLicenseDto } from '@domain/party-licenses/dto/entity/party-license.dto';
import { CreatePersonLicenseDto } from '@domain/party-licenses/dto/request/create-person-license.dto';
import { UpdateCompanyLicenseDto } from '@domain/party-licenses/dto/request/update-company-license.dto';
import { PartyLicensesDomainService } from '@domain/party-licenses/services/party-licenses.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleLicensesController {
  private readonly logger = new Logger(PeopleLicensesController.name);

  constructor(private readonly service: PartyLicensesDomainService) {}

  // Returns the paginated licenses of a person
  @MessagePattern({ cmd: 'org.people.licenses.table' })
  table(@Payload() data: { personId: string } & TableViewState): Promise<{ result: PartyLicenseDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.licenses.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Creates a license for a person
  @MessagePattern({ cmd: 'org.people.licenses.create' })
  create(@Payload() dto: CreatePersonLicenseDto): Promise<CreateResponseDto<PartyLicenseDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.licenses.create — personId: ${personId}`);
    return this.service.create(personId, payload);
  }

  // Updates a license by ID
  @MessagePattern({ cmd: 'org.people.licenses.update' })
  update(@Payload() dto: UpdateCompanyLicenseDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.licenses.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a license by ID
  @MessagePattern({ cmd: 'org.people.licenses.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.licenses.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
