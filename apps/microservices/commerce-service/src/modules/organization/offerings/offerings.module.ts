import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { OfferingAttributesDomainModule } from '@domain/offering-attributes/offering-attributes.module';
import { OfferingBomDomainModule } from '@domain/offering-bom/offering-bom.module';
import { OfferingDimensionsDomainModule } from '@domain/offering-dimensions/offering-dimensions.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { Module } from '@nestjs/common';
import { OrgOfferingAttributesController } from './attributes/offering-attributes.controller';
import { OrgOfferingDimensionsController } from './dimensions/offering-dimensions.controller';
import { OrgOfferingsController } from './root/offerings.controller';
import { OrgOfferingBomController } from './variants/bom/offering-bom.controller';
import { OrgOfferingBomService } from './variants/bom/services/offering-bom.service';
import { OrgOfferingVariantsController } from './variants/root/offering-variants.controller';

@Module({
  // The API layer may import a domain module; domain modules never import each other
  imports: [
    OfferingsDomainModule,
    OfferingAttributesDomainModule,
    OfferingDimensionsDomainModule,
    OfferingVariantsDomainModule,
    OfferingBomDomainModule,
    InventoryItemsDomainModule,
  ],
  controllers: [
    OrgOfferingsController,
    OrgOfferingAttributesController,
    OrgOfferingDimensionsController,
    OrgOfferingVariantsController,
    OrgOfferingBomController,
  ],
  providers: [OrgOfferingBomService],
})
export class OrgOfferingsModule {}
