import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { Module } from '@nestjs/common';
import { PeopleAddressesController } from './addresses/people-addresses.controller';
import { PeopleCompaniesController } from './companies/people-companies.controller';
import { PeopleIdentifiersController } from './identifiers/people-identifiers.controller';
import { PeopleController } from './root/people.controller';

@Module({
  imports: [
    PartiesDomainModule,
    PartyIdentifiersDomainModule,
    PartyRelationshipsDomainModule,
    PartyAddressesDomainModule,
  ],
  controllers: [PeopleController, PeopleIdentifiersController, PeopleCompaniesController, PeopleAddressesController],
})
export class OrgPeopleModule {}
