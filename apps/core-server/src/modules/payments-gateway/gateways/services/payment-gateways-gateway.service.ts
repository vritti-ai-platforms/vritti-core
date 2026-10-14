import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import { PaymentGatewayConfigDomainService } from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { PaymentGatewayOptionDto } from '../dto/response/payment-gateway-option.dto';

interface VerifyCredentialsResult {
  ok: true;
  providerMerchantId: string | null;
}

@Injectable()
export class PaymentGatewaysGatewayService {
  private readonly logger = new Logger(PaymentGatewaysGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
  ) {}

  // The gateways payments-service can actually charge through, with the credential fields each one takes
  async listGateways(): Promise<PaymentGatewayOptionDto[]> {
    this.logger.log('payments.gateways.list');
    const { gateways } = await this.nats.send<{ gateways: PaymentGatewayOptionDto[] }>(
      'payments',
      'payments.gateways.list',
      {},
    );
    return gateways;
  }

  // Has the provider check a config's stored credentials, then records the pass on the config
  async verifyConfig(orgId: string, configId: string): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const { gatewayCode, credentials } = await this.configService.getDecryptedCredentials(orgId, configId);

    this.logger.log(`payments.gateways.verifyCredentials — config: ${configId} gateway: ${gatewayCode}`);
    const result = await this.nats.send<VerifyCredentialsResult>('payments', 'payments.gateways.verifyCredentials', {
      gatewayCode,
      credentials,
    });

    return this.configService.markVerified(orgId, configId, result.providerMerchantId);
  }
}
