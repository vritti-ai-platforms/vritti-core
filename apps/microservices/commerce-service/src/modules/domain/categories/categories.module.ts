import { Module } from '@nestjs/common';
import { CategoriesDomainRepository } from './repositories/categories.repository';
import { CategoriesDomainService } from './services/categories.service';

@Module({
  providers: [CategoriesDomainService, CategoriesDomainRepository],
  exports: [CategoriesDomainService, CategoriesDomainRepository],
})
export class CategoriesDomainModule {}
