import { CostCategoriesDomainModule } from '@domain/cost-categories/cost-categories.module';
import { Module } from '@nestjs/common';
import { CostCategoriesController } from './cost-categories.controller';

@Module({
  imports: [CostCategoriesDomainModule],
  controllers: [CostCategoriesController],
})
export class CostCategoriesModule {}
