import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from '@/modules/commerce-gateway/commerce-gateway-services.module';
import { BankAccountController } from './bank-accounts/bank-account.controller';
import { BankAccountInternalController } from './bank-accounts/bank-account-internal.controller';
import { LegalEntityController } from './legal-entities/legal-entity.controller';
import { PaymentGatewayConfigInternalController } from './payment-gateway-configs/payment-gateway-config-internal.controller';
import { PaymentLinkedAccountInternalController } from './payment-linked-accounts/payment-linked-account-internal.controller';
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
    BankAccountController,
    BankAccountInternalController,
    PaymentGatewayConfigInternalController,
    PaymentLinkedAccountInternalController,
  ],
})
export class StructureApiModule {}
