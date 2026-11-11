import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { Module } from '@nestjs/common';
import { GatewaysController } from './root/gateways.controller';
import { GatewaysService } from './root/services/gateways.service';

// What Vritti Cloud asks while a gateway config or a payout account is set up: which gateways exist, whether a key
// pair works, whether a seller's account exists. Reached only through core's cloud-facing routes; nothing is stored
@Module({
  imports: [GatewaysDomainModule],
  controllers: [GatewaysController],
  providers: [GatewaysService],
})
export class InternalGatewaysModule {}
