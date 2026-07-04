import { CatalogDomainModule } from '@domain/catalog/catalog.module';
import { Module } from '@nestjs/common';
import { CloudSignatureGuard } from '@/common/guards/cloud-signature.guard';
import { CatalogController } from './controllers/catalog.controller';

@Module({
  imports: [CatalogDomainModule],
  controllers: [CatalogController],
  providers: [CloudSignatureGuard],
})
export class CatalogApiModule {}
