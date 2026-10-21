import { AppDomainModule } from '@domain/app/app.module';
import { BankAccountDomainModule } from '@domain/bank-account/bank-account.module';
import { LegalEntityDomainModule } from '@domain/legal-entity/legal-entity.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { PayoutAccountDomainModule } from '@domain/payout-account/payout-account.module';
import { PayoutChannelDomainModule } from '@domain/payout-channel/payout-channel.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { SiteGroupDomainModule } from '@domain/site-group/site-group.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from '@/modules/commerce-gateway/commerce-gateway-services.module';
import { PaymentsGatewayServicesModule } from '@/modules/payments-gateway/payments-gateway-services.module';
import { BankAccountService } from './bank-accounts/services/bank-account-api.service';
import { LegalEntityService } from './legal-entities/services/legal-entity-api.service';
import { PaymentGatewayConfigService } from './payment-gateway-configs/services/payment-gateway-config-api.service';
import { PayoutAccountService } from './payout-accounts/services/payout-account-api.service';
import { PayoutChannelService } from './payout-channels/services/payout-channel-api.service';
import { StructureService } from './root/services/structure-api.service';
import { SiteGroupService } from './site-groups/services/site-group-api.service';
import { SiteService } from './sites/services/site-api.service';

const services = [
  StructureService,
  LegalEntityService,
  SiteService,
  SiteGroupService,
  BankAccountService,
  PaymentGatewayConfigService,
  PayoutAccountService,
  PayoutChannelService,
];

// Structure services, and nothing else
@Module({
  imports: [
    CommerceGatewayServicesModule,
    PaymentsGatewayServicesModule,
    BankAccountDomainModule,
    PaymentGatewayConfigDomainModule,
    PayoutAccountDomainModule,
    PayoutChannelDomainModule,
    AppDomainModule,
    LegalEntityDomainModule,
    SiteDomainModule,
    SiteGroupDomainModule,
    OrganizationDomainModule,
    UserRoleDomainModule,
  ],
  providers: services,
  exports: services,
})
export class StructureServicesModule {}
