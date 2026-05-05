import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { Module } from '@nestjs/common';
import { ItemsRepository } from './repositories/items.repository';
import { ItemsService } from './services/items.service';

@Module({
  imports: [CategoriesDomainModule],
  providers: [ItemsService, ItemsRepository],
  exports: [ItemsService, ItemsRepository],
})
export class ItemsDomainModule {}
