import { OfferingAttributesDomainModule } from '@domain/offering-attributes/offering-attributes.module';
import { OfferingBomDomainModule } from '@domain/offering-bom/offering-bom.module';
import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { LeOfferingAttributesController } from './attributes/offering-attributes.controller';
import { LeOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { LeOfferingsController } from './root/offerings.controller';
import { LeOfferingBomController } from './variants/bom/offering-bom.controller';
import { LeOfferingVariantsController } from './variants/root/offering-variants.controller';

@Module({
  imports: [
    OfferingsDomainModule,
    OfferingAttributesDomainModule,
    OfferingDimensionsDomainModule,
    OfferingVariantsDomainModule,
    OfferingBomDomainModule,
  ],
  controllers: [
    LeOfferingsController,
    LeOfferingAttributesController,
    LeOfferingDimensionsController,
    LeOfferingVariantsController,
    LeOfferingBomController,
  ],
})
export class LeOfferingsModule {}
