import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { LeTaxRegistrationDomainRepository } from './repositories/le-tax-registration.repository';
import { LegalEntityDomainRepository } from './repositories/legal-entity.repository';
import { LegalEntityDomainService } from './services/legal-entity.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [LegalEntityDomainService, LegalEntityDomainRepository, LeTaxRegistrationDomainRepository],
  exports: [LegalEntityDomainService, LegalEntityDomainRepository, LeTaxRegistrationDomainRepository],
})
export class LegalEntityDomainModule {}
