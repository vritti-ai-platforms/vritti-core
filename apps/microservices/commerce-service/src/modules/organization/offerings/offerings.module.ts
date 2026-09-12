import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { OrgOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { OrgOfferingsController } from './root/offerings.controller';
import { OrgOfferingVariantsController } from './variants/offering-variants.controller';
import { OrgOfferingVariantsService } from './variants/services/offering-variants.service';

@Module({
  // The API layer may import a domain module; domain modules never import each other
  imports: [
    OfferingsDomainModule,
    OfferingDimensionsDomainModule,
    OfferingVariantsDomainModule,
    InventoryItemsDomainModule,
  ],
  controllers: [OrgOfferingsController, OrgOfferingDimensionsController, OrgOfferingVariantsController],
  providers: [OrgOfferingVariantsService],
})
export class OrgOfferingsModule {}
