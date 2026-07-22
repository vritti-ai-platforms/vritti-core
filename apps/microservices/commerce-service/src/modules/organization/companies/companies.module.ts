import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyBankAccountsDomainModule } from '@domain/party-bank-accounts/party-bank-accounts.module';
import { PartyCommunicationsDomainModule } from '@domain/party-communications/party-communications.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyLicensesDomainModule } from '@domain/party-licenses/party-licenses.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { PartySocialProfilesDomainModule } from '@domain/party-social-profiles/party-social-profiles.module';
import { Module } from '@nestjs/common';
import { CompanyAddressesController } from './addresses/company-addresses.controller';
import { CompanyBankAccountsController } from './bank-accounts/company-bank-accounts.controller';
import { CompanyCommunicationsController } from './communications/company-communications.controller';
import { CompanyIdentifiersController } from './identifiers/company-identifiers.controller';
import { CompanyLicensesController } from './licenses/company-licenses.controller';
import { CompanyPeopleController } from './people/company-people.controller';
import { CompanyRegistrationsController } from './registrations/company-registrations.controller';
import { CompanySocialProfilesController } from './social-profiles/company-social-profiles.controller';
import { CompaniesController } from './root/companies.controller';
import { CompaniesService } from './root/services/companies-root.service';

@Module({
  imports: [
    PartiesDomainModule,
    PartyIdentifiersDomainModule,
    PartyRelationshipsDomainModule,
    PartyAddressesDomainModule,
    PartyLicensesDomainModule,
    PartyBankAccountsDomainModule,
    PartyCommunicationsDomainModule,
    PartySocialProfilesDomainModule,
  ],
  controllers: [
    CompaniesController,
    CompanyPeopleController,
    CompanyRegistrationsController,
    CompanyIdentifiersController,
    CompanyAddressesController,
    CompanyLicensesController,
    CompanyBankAccountsController,
    CompanyCommunicationsController,
    CompanySocialProfilesController,
  ],
  providers: [CompaniesService],
})
export class OrgCompaniesModule {}
