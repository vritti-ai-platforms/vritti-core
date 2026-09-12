import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { Module } from '@nestjs/common';
import { OrgCatalogsController } from './catalogs.controller';

@Module({
  imports: [CatalogsDomainModule],
  controllers: [OrgCatalogsController],
})
export class OrgCatalogsModule {}
