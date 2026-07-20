import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyBankAccountsDomainModule } from '@domain/party-bank-accounts/party-bank-accounts.module';
import { PartyContactsDomainModule } from '@domain/party-contacts/party-contacts.module';
import { PartyIdentifiersDomainModule } from '@domain/party-identifiers/party-identifiers.module';
import { PartyLicensesDomainModule } from '@domain/party-licenses/party-licenses.module';
import { PartyRelationshipsDomainModule } from '@domain/party-relationships/party-relationships.module';
import { Module } from '@nestjs/common';
import { CompanyAddressesController } from './addresses/company-addresses.controller';
import { CompanyBankAccountsController } from './bank-accounts/company-bank-accounts.controller';
import { CompanyContactsController } from './contacts/company-contacts.controller';
import { CompanyIdentifiersController } from './identifiers/company-identifiers.controller';
import { CompanyLicensesController } from './licenses/company-licenses.controller';
import { CompanyPeopleController } from './people/company-people.controller';
import { CompanyRegistrationsController } from './registrations/company-registrations.controller';
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
    PartyContactsDomainModule,
  ],
  controllers: [
    CompaniesController,
    CompanyPeopleController,
    CompanyRegistrationsController,
    CompanyIdentifiersController,
    CompanyAddressesController,
    CompanyLicensesController,
    CompanyBankAccountsController,
    CompanyContactsController,
  ],
  providers: [CompaniesService],
})
export class OrgCompaniesModule {}
