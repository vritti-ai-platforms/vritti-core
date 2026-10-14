import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { Module } from '@nestjs/common';
import { LinkedAccountsController } from './root/linked-accounts.controller';
import { LinkedAccountsService } from './root/services/linked-accounts.service';

@Module({
  imports: [GatewaysDomainModule],
  controllers: [LinkedAccountsController],
  providers: [LinkedAccountsService],
})
export class OrgLinkedAccountsModule {}
