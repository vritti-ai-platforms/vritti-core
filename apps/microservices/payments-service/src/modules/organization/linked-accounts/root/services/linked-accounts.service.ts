import type { CreateLinkedAccountDto } from '@domain/gateways/dto/request/create-linked-account.dto';
import type { FetchLinkedAccountStatusDto } from '@domain/gateways/dto/request/fetch-linked-account-status.dto';
import type { LookupLinkedAccountDto } from '@domain/gateways/dto/request/lookup-linked-account.dto';
import { GatewayRegistry } from '@domain/gateways/gateway-registry';
import type {
  CreateLinkedAccountResult,
  LinkedAccountLookup,
  LinkedAccountStatusResult,
} from '@domain/gateways/gateway-transport';
import { Injectable, Logger } from '@nestjs/common';

// Onboards a linked account at the vendor for split payments. Core owns the linked-account record and
// the merchant's credentials; this service only relays to the gateway and persists nothing.
@Injectable()
export class LinkedAccountsService {
  private readonly logger = new Logger(LinkedAccountsService.name);

  constructor(private readonly registry: GatewayRegistry) {}

  // Creates and configures the linked account on the gateway, returning the vendor ids core stores
  async create(dto: CreateLinkedAccountDto): Promise<CreateLinkedAccountResult> {
    const result = await this.registry
      .resolveSplit(dto.gatewayCode)
      .createLinkedAccount(dto.credentials, dto.account, dto.resume);
    this.logger.log(`Created ${dto.gatewayCode} linked account ${result.providerAccountId} (${result.status})`);
    return result;
  }

  // Reads the linked account's activation state and outstanding requirements from the gateway
  async status(dto: FetchLinkedAccountStatusDto): Promise<LinkedAccountStatusResult> {
    return this.registry.resolveSplit(dto.gatewayCode).fetchLinkedAccountStatus(dto.credentials, {
      providerAccountId: dto.providerAccountId,
      providerData: dto.providerData,
    });
  }

  // Looks an existing linked account up at the gateway under the config's keys
  async lookup(dto: LookupLinkedAccountDto): Promise<LinkedAccountLookup | null> {
    const account = await this.registry
      .resolveSplit(dto.gatewayCode)
      .fetchLinkedAccount(dto.credentials, dto.providerAccountId);
    this.logger.log(
      `Looked up ${dto.gatewayCode} linked account ${dto.providerAccountId}: ${account?.status ?? 'missing'}`,
    );
    return account;
  }
}
