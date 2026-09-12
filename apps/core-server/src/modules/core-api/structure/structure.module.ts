import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from '@/modules/commerce-gateway/commerce-gateway-services.module';
import { LegalEntityController } from './legal-entities/legal-entity.controller';
import { StructureController } from './root/structure.controller';
import { SiteGroupController } from './site-groups/site-group.controller';
import { SiteController } from './sites/site.controller';
import { StructureServicesModule } from './structure-services.module';
import { TaxJurisdictionInternalController } from './tax-jurisdictions/tax-jurisdiction-internal.controller';
import { TaxRegistrationInternalController } from './tax-registrations/tax-registration-internal.controller';

// The internal structure surface: controllers only. Services come from StructureServicesModule so
// the external-app surface can reach them without importing this module's resolvers.
@Module({
  imports: [StructureServicesModule, CommerceGatewayServicesModule],
  controllers: [
    StructureController,
    LegalEntityController,
    SiteController,
    SiteGroupController,
    TaxRegistrationInternalController,
    TaxJurisdictionInternalController,
  ],
})
export class StructureApiModule {}
