import { CartsDomainModule } from '@domain/carts/carts.module';
import { OrdersDomainModule } from '@domain/orders/orders.module';
import { PartiesDomainModule } from '@domain/parties/parties.module';
import { PartyAddressesDomainModule } from '@domain/party-addresses/party-addresses.module';
import { PartyCommunicationsDomainModule } from '@domain/party-communications/party-communications.module';
import { Module } from '@nestjs/common';
import { OrdersRootController } from './root/orders-root.controller';
import { SiteOrdersService } from './root/services/orders-root.service';

@Module({
  imports: [
    OrdersDomainModule,
    CartsDomainModule,
    PartiesDomainModule,
    PartyAddressesDomainModule,
    PartyCommunicationsDomainModule,
  ],
  controllers: [OrdersRootController],
  providers: [SiteOrdersService],
})
export class SiteOrdersModule {}
