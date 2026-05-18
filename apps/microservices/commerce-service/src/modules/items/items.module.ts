import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { ItemsDomainModule } from '@domain/items/items.module';
import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';

@Module({
  imports: [ItemsDomainModule, CategoriesDomainModule],
  controllers: [ItemsController],
})
export class ItemsModule {}
