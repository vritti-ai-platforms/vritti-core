import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { Module } from '@nestjs/common';
import { GatewaysController } from './root/gateways.controller';
import { GatewaysService } from './root/services/gateways.service';

@Module({
  imports: [GatewaysDomainModule],
  controllers: [GatewaysController],
  providers: [GatewaysService],
})
export class OrgGatewaysModule {}
