import type { VerifyGatewayCredentialsDto } from '@domain/gateways/dto/request/verify-gateway-credentials.dto';
import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type { GatewayDescriptor } from '@domain/gateways/gateway-transport';
import { Injectable, Logger } from '@nestjs/common';

export interface GatewayListResult {
  gateways: GatewayDescriptor[];
}

export interface VerifyGatewayCredentialsResult {
  ok: true;
  providerMerchantId: string | null;
}

@Injectable()
export class GatewaysService {
  private readonly logger = new Logger(GatewaysService.name);

  constructor(private readonly registry: GatewayRegistry) {}

  list(): GatewayListResult {
    return { gateways: this.registry.available() };
  }

  // Proves a key pair against the vendor before core stores it; nothing is persisted here
  async verifyCredentials(dto: VerifyGatewayCredentialsDto): Promise<VerifyGatewayCredentialsResult> {
    const { providerMerchantId } = await this.registry.resolve(dto.gatewayCode).verifyCredentials(dto.credentials);
    this.logger.log(`Verified ${dto.gatewayCode} credentials`);
    return { ok: true, providerMerchantId };
  }
}
