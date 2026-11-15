import { CostCategoriesDomainModule } from '@domain/cost-categories/cost-categories.module';
import { Module } from '@nestjs/common';
import { CostCategoriesRootController } from './root/cost-categories-root.controller';

@Module({
  imports: [CostCategoriesDomainModule],
  controllers: [CostCategoriesRootController],
})
export class OrgCostCategoriesModule {}
