import { CatalogDomainModule } from '@domain/catalog/catalog.module';
import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';

@Module({
  imports: [CatalogDomainModule],
  controllers: [CatalogController],
})
export class CatalogApiModule {}
