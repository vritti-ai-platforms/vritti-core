import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { LeTaxRegistrationRepository } from './repositories/le-tax-registration.repository';
import { LegalEntityRepository } from './repositories/legal-entity.repository';
import { LegalEntityService } from './services/legal-entity.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [LegalEntityService, LegalEntityRepository, LeTaxRegistrationRepository],
  exports: [LegalEntityService, LegalEntityRepository, LeTaxRegistrationRepository],
})
export class LegalEntityDomainModule {}
