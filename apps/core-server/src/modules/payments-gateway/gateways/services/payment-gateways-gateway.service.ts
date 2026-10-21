import type { PaymentGatewayConfigVerificationResponseDto } from '@domain/payment-gateway-config/dto/response/payment-gateway-config-verification-response.dto';
import {
  PaymentGatewayConfigDomainService,
  type PaymentGatewayConfigScope,
} from '@domain/payment-gateway-config/services/payment-gateway-config.service';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { PaymentGatewayOptionDto } from '../dto/response/payment-gateway-option.dto';

interface VerifyCredentialsResult {
  ok: true;
}

@Injectable()
export class PaymentGatewaysGatewayService {
  private readonly logger = new Logger(PaymentGatewaysGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly configService: PaymentGatewayConfigDomainService,
  ) {}

  // Whether a gateway can split a payment across linked accounts, as payments-service reports it
  async supportsSplit(gatewayCode: string): Promise<boolean> {
    const gateways = await this.listGateways();
    return gateways.some((gateway) => gateway.code === gatewayCode && gateway.supportsSplit);
  }

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

  // Has the provider check a config's stored credentials, then records the pass on the config. `orgId` null is the
  // platform scope (cloud admin verifying Vritti's gateway)
  async verifyConfig(
    orgId: PaymentGatewayConfigScope,
    configId: string,
  ): Promise<PaymentGatewayConfigVerificationResponseDto> {
    const { gatewayCode, credentials } = await this.configService.getDecryptedCredentials(orgId, configId);

    this.logger.log(`payments.gateways.verifyCredentials — config: ${configId} gateway: ${gatewayCode}`);
    await this.nats.send<VerifyCredentialsResult>('payments', 'payments.gateways.verifyCredentials', {
      gatewayCode,
      credentials,
    });

    return this.configService.markVerified(orgId, configId);
  }
}
