import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyBankAccountsDomainModule } from '@domain/party-bank-accounts/party-bank-accounts.module';
import { PartyContactsDomainModule } from '@domain/party-contacts/party-contacts.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyLicensesDomainModule } from '@domain/party-licenses/party-licenses.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { Module } from '@nestjs/common';
import { PeopleAddressesController } from './addresses/people-addresses.controller';
import { PeopleBankAccountsController } from './bank-accounts/people-bank-accounts.controller';
import { PeopleCompaniesController } from './companies/people-companies.controller';
import { PeopleContactsController } from './contacts/people-contacts.controller';
import { PeopleIdentifiersController } from './identifiers/people-identifiers.controller';
import { PeopleLicensesController } from './licenses/people-licenses.controller';
import { PeopleRegistrationsController } from './registrations/people-registrations.controller';
import { PeopleController } from './root/people.controller';
import { PeopleService } from './root/services/people-root.service';

@Module({
  imports: [
    PartiesDomainModule,
    PartyIdentifiersDomainModule,
    PartyRelationshipsDomainModule,
    PartyAddressesDomainModule,
    PartyBankAccountsDomainModule,
    PartyContactsDomainModule,
    PartyLicensesDomainModule,
  ],
  controllers: [
    PeopleController,
    PeopleIdentifiersController,
    PeopleCompaniesController,
    PeopleAddressesController,
    PeopleRegistrationsController,
    PeopleLicensesController,
    PeopleBankAccountsController,
    PeopleContactsController,
  ],
  providers: [PeopleService],
})
export class OrgPeopleModule {}
