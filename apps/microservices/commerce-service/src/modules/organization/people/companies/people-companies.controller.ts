import type { PersonCompanyDto } from '@domain/party-relationships/dto/entity/person-company.dto';
import { PartyRelationshipsService } from '@domain/party-relationships/services/party-relationships.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleCompaniesController {
  private readonly logger = new Logger(PeopleCompaniesController.name);

  constructor(private readonly service: PartyRelationshipsService) {}

  // Returns paginated companies a person is linked to for the person's companies table
  @MessagePattern({ cmd: 'org.people.companies.table' })
  async table(
    @Payload() payload: { personId: string } & TableViewState,
  ): Promise<{ result: PersonCompanyDto[]; count: number }> {
    const { personId, ...state } = payload;
    this.logger.log(`people.companies.table — personId: ${personId}`);
    return this.service.findCompaniesForPerson(personId, state);
  }
}
