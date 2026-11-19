import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { Module } from '@nestjs/common';
import { SiteInboundDeliveriesModule } from '@/modules/site/inbound-deliveries/inbound-deliveries.module';
import { LeInboundDeliveriesLinesController } from './lines/inbound-deliveries-lines.controller';
import { LeInboundDeliveriesRootController } from './root/inbound-deliveries-root.controller';

@Module({
  imports: [SiteInboundDeliveriesModule, InboundDeliveriesDomainModule],
  controllers: [LeInboundDeliveriesRootController, LeInboundDeliveriesLinesController],
})
export class LeInboundDeliveriesModule {}
