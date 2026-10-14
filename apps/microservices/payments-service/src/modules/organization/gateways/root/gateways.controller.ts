import { VerifyGatewayCredentialsDto } from '@domain/gateways/dto/request/verify-gateway-credentials.dto';
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
}
