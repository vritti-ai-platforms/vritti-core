import { OfferingAttributesDomainModule } from '@domain/offering-attributes/offering-attributes.module';
import { OfferingBomDomainModule } from '@domain/offering-bom/offering-bom.module';
import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { SiteOfferingAttributesController } from './attributes/offering-attributes.controller';
import { SiteOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { SiteOfferingsController } from './root/offerings.controller';
import { SiteOfferingBomController } from './variants/bom/offering-bom.controller';
import { SiteOfferingVariantsController } from './variants/root/offering-variants.controller';

@Module({
  imports: [
    OfferingsDomainModule,
    OfferingAttributesDomainModule,
    OfferingDimensionsDomainModule,
    OfferingVariantsDomainModule,
    OfferingBomDomainModule,
  ],
  controllers: [
    SiteOfferingsController,
    SiteOfferingAttributesController,
    SiteOfferingDimensionsController,
    SiteOfferingVariantsController,
    SiteOfferingBomController,
  ],
})
export class SiteOfferingsModule {}
