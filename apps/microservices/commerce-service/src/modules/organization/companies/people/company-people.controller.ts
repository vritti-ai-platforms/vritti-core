import type { PartyRelationshipDto } from '@domain/party-relationships/dto/entity/party-relationship.dto';
import { PartyRelationshipsService } from '@domain/party-relationships/services/party-relationships.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddCompanyPersonDto } from './dto/request/add-company-person.dto';

@Controller()
export class CompanyPeopleController {
  private readonly logger = new Logger(CompanyPeopleController.name);

  constructor(private readonly service: PartyRelationshipsService) {}

  // Returns the paginated people (person relationships) of a company
  @MessagePattern({ cmd: 'org.companies.people.table' })
  async table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyRelationshipDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.people.table — companyId: ${companyId}`);
    return this.service.findRelationshipsForTable(companyId, state);
  }

  // Links a person to a company
  @MessagePattern({ cmd: 'org.companies.people.add' })
  async add(@Payload() dto: AddCompanyPersonDto): Promise<CreateResponseDto<PartyRelationshipDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.people.add — companyId: ${companyId}, childPartyId: ${payload.childPartyId}`);
    return this.service.addRelationship(companyId, payload);
  }

  // Removes a company-person relationship
  @MessagePattern({ cmd: 'org.companies.people.remove' })
  async remove(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.people.remove — id: ${data.id}`);
    return this.service.removeRelationship(data.id);
  }
}
