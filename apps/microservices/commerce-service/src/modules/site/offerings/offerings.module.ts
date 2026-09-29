import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { SiteOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { SiteOfferingsController } from './root/offerings.controller';
import { SiteOfferingBomController } from './variants/bom/offering-bom.controller';
import { SiteOfferingVariantsController } from './variants/root/offering-variants.controller';

@Module({
  imports: [OfferingsDomainModule, OfferingDimensionsDomainModule, OfferingVariantsDomainModule],
  controllers: [
    SiteOfferingsController,
    SiteOfferingDimensionsController,
    SiteOfferingVariantsController,
    SiteOfferingBomController,
  ],
})
export class SiteOfferingsModule {}
