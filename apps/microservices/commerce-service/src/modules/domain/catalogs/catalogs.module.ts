import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { CatalogsRepository } from './repositories/catalogs.repository';
import { CatalogsService } from './services/catalogs.service';

@Module({
  imports: [CatalogChannelsDomainModule],
  providers: [CatalogsService, CatalogsRepository],
  exports: [CatalogsService, CatalogsRepository],
})
export class CatalogsDomainModule {}
