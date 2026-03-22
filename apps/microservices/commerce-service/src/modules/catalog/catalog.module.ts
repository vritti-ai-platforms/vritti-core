import { Module } from '@nestjs/common';
import { CategoryController } from './category/controllers/category.controller';
import { CategoryRepository } from './category/repositories/category.repository';
import { CategoryService } from './category/services/category.service';
import { ProductController } from './product/controllers/product.controller';
import { ProductRepository } from './product/repositories/product.repository';
import { ProductService } from './product/services/product.service';

@Module({
  controllers: [CategoryController, ProductController],
  providers: [CategoryService, CategoryRepository, ProductService, ProductRepository],
  exports: [ProductRepository],
})
export class CatalogModule {}
