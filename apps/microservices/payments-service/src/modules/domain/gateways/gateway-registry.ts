import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { GatewayDescriptor, GatewaySplitCapability, PaymentGatewayTransport } from './gateway-transport';

// Resolves a gateway code to its transport. The registry is the only honest answer to "which gateways
// can be connected?" — a static list duplicated across layers drifts the moment a transport is added.
@Injectable()
export class GatewayRegistry {
  private readonly transports: Map<string, PaymentGatewayTransport>;

  constructor(transports: PaymentGatewayTransport[]) {
    this.transports = new Map(transports.map((transport) => [transport.code, transport]));
  }

  resolve(code: string): PaymentGatewayTransport {
    const transport = this.transports.get(code);
    if (!transport) {
      throw new BadRequestException({
        label: 'Unsupported Gateway',
        detail: `No payment gateway is registered under "${code}". Pick one of the available gateways.`,
      });
    }
    return transport;
  }

  // Resolves a gateway code to its split-payment capability, refusing a gateway that has none
  resolveSplit(code: string): GatewaySplitCapability {
    const split = this.resolve(code).split;
    if (!split) {
      throw new BadRequestException({
        label: 'Split Payments Unsupported',
        detail: `The "${code}" gateway cannot route payments to linked accounts. Pick a gateway that supports split payments.`,
        errors: [{ field: 'gatewayCode', message: 'Split not supported' }],
      });
    }
    return split;
  }

  // Every gateway that actually has a transport behind it, and the credential fields each one takes
  available(): GatewayDescriptor[] {
    return [...this.transports.values()].map((transport) => ({
      code: transport.code,
      credentialFields: [...transport.credentialFields],
      supportsSplit: transport.split !== undefined,
    }));
  }
}
