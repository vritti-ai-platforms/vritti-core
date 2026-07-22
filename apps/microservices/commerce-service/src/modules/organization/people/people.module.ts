import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyBankAccountsDomainModule } from '@domain/party-bank-accounts/party-bank-accounts.module';
import { PartyCommunicationsDomainModule } from '@domain/party-communications/party-communications.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyLicensesDomainModule } from '@domain/party-licenses/party-licenses.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { PartySocialProfilesDomainModule } from '@domain/party-social-profiles/party-social-profiles.module';
import { Module } from '@nestjs/common';
import { PeopleAddressesController } from './addresses/people-addresses.controller';
import { PeopleBankAccountsController } from './bank-accounts/people-bank-accounts.controller';
import { PeopleCommunicationsController } from './communications/people-communications.controller';
import { PeopleCompaniesController } from './companies/people-companies.controller';
import { PeopleSocialProfilesController } from './social-profiles/people-social-profiles.controller';
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
    PartyLicensesDomainModule,
    PartyCommunicationsDomainModule,
    PartySocialProfilesDomainModule,
  ],
  controllers: [
    PeopleController,
    PeopleIdentifiersController,
    PeopleCompaniesController,
    PeopleAddressesController,
    PeopleRegistrationsController,
    PeopleLicensesController,
    PeopleBankAccountsController,
    PeopleCommunicationsController,
    PeopleSocialProfilesController,
  ],
  providers: [PeopleService],
})
export class OrgPeopleModule {}
