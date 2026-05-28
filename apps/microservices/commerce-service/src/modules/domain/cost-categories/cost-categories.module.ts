import { Module } from '@nestjs/common';
import { CostCategoriesRepository } from './repositories/cost-categories.repository';
import { CostCategoriesService } from './services/cost-categories.service';

@Module({
  providers: [CostCategoriesService, CostCategoriesRepository],
  exports: [CostCategoriesService, CostCategoriesRepository],
})
export class CostCategoriesDomainModule {}
