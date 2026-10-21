import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from '@/modules/commerce-gateway/commerce-gateway-services.module';
import { BankAccountController } from './bank-accounts/bank-account.controller';
import { BankAccountInternalController } from './bank-accounts/bank-account-internal.controller';
import { LegalEntityController } from './legal-entities/legal-entity.controller';
import { PaymentGatewayConfigInternalController } from './payment-gateway-configs/payment-gateway-config-internal.controller';
import { PayoutAccountInternalController } from './payout-accounts/payout-account-internal.controller';
import { PayoutChannelInternalController } from './payout-channels/payout-channel-internal.controller';
import { StructureController } from './root/structure.controller';
import { SiteGroupController } from './site-groups/site-group.controller';
import { SiteController } from './sites/site.controller';
import { StructureServicesModule } from './structure-services.module';
import { TaxJurisdictionInternalController } from './tax-jurisdictions/tax-jurisdiction-internal.controller';
import { TaxRegistrationInternalController } from './tax-registrations/tax-registration-internal.controller';

// The internal structure surface: controllers only.
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
    PayoutAccountInternalController,
    PayoutChannelInternalController,
  ],
})
export class StructureApiModule {}
