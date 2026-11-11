import { LookupGatewayAccountDto } from '@domain/gateways/dto/request/lookup-gateway-account.dto';
import { VerifyGatewayCredentialsDto } from '@domain/gateways/dto/request/verify-gateway-credentials.dto';
import type { GatewayAccountLookup } from '@domain/gateways/gateway-transport';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  type GatewayListResult,
  GatewaysService,
  type VerifyGatewayCredentialsResult,
} from './services/gateways.service';

@Controller()
export class GatewaysController {
  private readonly logger = new Logger(GatewaysController.name);

  constructor(private readonly service: GatewaysService) {}

  @MessagePattern({ cmd: 'payments.gateways.list' })
  async list(): Promise<GatewayListResult> {
    this.logger.log('gateways.list');
    return this.service.list();
  }

  @MessagePattern({ cmd: 'payments.gateways.verifyCredentials' })
  async verifyCredentials(@Payload() dto: VerifyGatewayCredentialsDto): Promise<VerifyGatewayCredentialsResult> {
    this.logger.log(`gateways.verifyCredentials — gateway: ${dto.gatewayCode}`);
    return this.service.verifyCredentials(dto);
  }

  // Looks a seller's account up at the gateway; null when the gateway has none under these keys
  @MessagePattern({ cmd: 'payments.gateways.lookupAccount' })
  async lookupAccount(@Payload() dto: LookupGatewayAccountDto): Promise<{ account: GatewayAccountLookup | null }> {
    this.logger.log(`gateways.lookupAccount — gateway: ${dto.gatewayCode}, account: ${dto.providerAccountId}`);
    return { account: await this.service.lookupAccount(dto) };
  }
}
