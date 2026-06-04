import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [CategoriesDomainModule],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
