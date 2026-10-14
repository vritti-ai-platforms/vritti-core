import { CreateLinkedAccountDto } from '@domain/gateways/dto/request/create-linked-account.dto';
import { FetchLinkedAccountStatusDto } from '@domain/gateways/dto/request/fetch-linked-account-status.dto';
import type { CreateLinkedAccountResult, LinkedAccountStatusResult } from '@domain/gateways/gateway-transport';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LinkedAccountsService } from './services/linked-accounts.service';

@Controller()
export class LinkedAccountsController {
  private readonly logger = new Logger(LinkedAccountsController.name);

  constructor(private readonly service: LinkedAccountsService) {}

  // Creates a split-payment linked account on the gateway
  @MessagePattern({ cmd: 'payments.linkedAccounts.create' })
  async create(@Payload() dto: CreateLinkedAccountDto): Promise<CreateLinkedAccountResult> {
    this.logger.log(`linkedAccounts.create — gateway: ${dto.gatewayCode}, reference: ${dto.account.referenceId}`);
    return this.service.create(dto);
  }

  // Fetches a linked account's activation status from the gateway
  @MessagePattern({ cmd: 'payments.linkedAccounts.status' })
  async status(@Payload() dto: FetchLinkedAccountStatusDto): Promise<LinkedAccountStatusResult> {
    this.logger.log(`linkedAccounts.status — gateway: ${dto.gatewayCode}, account: ${dto.providerAccountId}`);
    return this.service.status(dto);
  }
}
