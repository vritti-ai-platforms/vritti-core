import { Module } from '@nestjs/common';
import { CostCategoriesDomainRepository } from './repositories/cost-categories.repository';
import { CostCategoriesDomainService } from './services/cost-categories.service';

@Module({
  providers: [CostCategoriesDomainService, CostCategoriesDomainRepository],
  exports: [CostCategoriesDomainService, CostCategoriesDomainRepository],
})
export class CostCategoriesDomainModule {}
