import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { LeOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { LeOfferingsController } from './root/offerings.controller';
import { LeOfferingVariantsController } from './variants/offering-variants.controller';

@Module({
  imports: [OfferingsDomainModule, OfferingDimensionsDomainModule, OfferingVariantsDomainModule],
  controllers: [LeOfferingsController, LeOfferingDimensionsController, LeOfferingVariantsController],
})
export class LeOfferingsModule {}
