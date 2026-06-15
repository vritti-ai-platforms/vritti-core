import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { Module } from '@nestjs/common';
import { CategoriesItemsController } from './items/categories-items.controller';
import { CategoriesItemsService } from './items/services/categories-items.service';
import { CategoriesRootController } from './root/categories-root.controller';

@Module({
  imports: [CategoriesDomainModule, InventoryItemsDomainModule],
  controllers: [CategoriesRootController, CategoriesItemsController],
  providers: [CategoriesItemsService],
})
export class CategoriesModule {}
