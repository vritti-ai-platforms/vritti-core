import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { ModifierGroupsDomainModule } from '@domain/modifier-groups/modifier-groups.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { VariantOptionsDomainModule } from '@domain/variant-options/variant-options.module';
import { Module } from '@nestjs/common';
import { CatalogChannelsController } from './channels/catalog-channels.controller';
import { ModifiersController } from './modifiers/modifiers.controller';
import { OfferingsController } from './offerings/offerings.controller';
import { CatalogsController } from './root/catalogs.controller';
import { VariantOptionsController } from './variant-options/variant-options.controller';

@Module({
  imports: [
    CatalogsDomainModule,
    CatalogChannelsDomainModule,
    OfferingsDomainModule,
    ModifierGroupsDomainModule,
    VariantOptionsDomainModule,
    CategoriesDomainModule,
  ],
  controllers: [
    CatalogsController,
    CatalogChannelsController,
    OfferingsController,
    VariantOptionsController,
    ModifiersController,
  ],
})
export class SiteCatalogsModule {}
