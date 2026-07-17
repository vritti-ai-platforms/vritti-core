import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { Module } from '@nestjs/common';
import { CompanyAddressesController } from './addresses/company-addresses.controller';
import { CompanyIdentifiersController } from './identifiers/company-identifiers.controller';
import { CompanyPeopleController } from './people/company-people.controller';
import { CompanyRegistrationsController } from './registrations/company-registrations.controller';
import { CompaniesController } from './root/companies.controller';

@Module({
  imports: [
    PartiesDomainModule,
    PartyIdentifiersDomainModule,
    PartyRelationshipsDomainModule,
    PartyAddressesDomainModule,
  ],
  controllers: [
    CompaniesController,
    CompanyPeopleController,
    CompanyRegistrationsController,
    CompanyIdentifiersController,
    CompanyAddressesController,
  ],
})
export class OrgCompaniesModule {}
