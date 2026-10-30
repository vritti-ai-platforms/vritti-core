import { CartsDomainModule } from '@domain/carts/carts.module';
import { OrdersDomainModule } from '@domain/orders/orders.module';
import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyCommunicationsDomainModule } from '@domain/party-communications/party-communications.module';
import { Module } from '@nestjs/common';
import { CheckoutsDomainRepository } from './repositories/checkouts.repository';
import { CheckoutsDomainService } from './services/checkouts.service';

@Module({
  imports: [
    CartsDomainModule,
    OrdersDomainModule,
    PartiesDomainModule,
    PartyAddressesDomainModule,
    PartyCommunicationsDomainModule,
  ],
  providers: [CheckoutsDomainService, CheckoutsDomainRepository],
  exports: [CheckoutsDomainService, CheckoutsDomainRepository],
})
export class CheckoutsDomainModule {}
