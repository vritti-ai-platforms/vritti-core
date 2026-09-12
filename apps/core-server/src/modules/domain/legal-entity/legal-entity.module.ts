import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { LegalEntityDomainRepository } from './repositories/legal-entity.repository';
import { LegalEntityDomainService } from './services/legal-entity.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [LegalEntityDomainService, LegalEntityDomainRepository],
  exports: [LegalEntityDomainService, LegalEntityDomainRepository],
})
export class LegalEntityDomainModule {}
