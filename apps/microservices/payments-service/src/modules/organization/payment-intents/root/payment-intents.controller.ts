import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import type { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import type { PaymentTransferDto } from '@domain/payment-transfers/dto/entity/payment-transfer.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ConfirmPaymentIntentDto,
  CreatePaymentIntentDto,
  ExecuteTransfersDto,
  ExpireStaleIntentsDto,
  PaymentIntentRefDto,
} from '@/modules/payment-lifecycle/dto/payment-intent-requests.dto';
import {
  type IntentWithEvents,
  PaymentLifecycleService,
} from '@/modules/payment-lifecycle/services/payment-lifecycle.service';

// Generic payment intents, for any caller that needs to take a payment. Reached only through core, which resolves
// the gateway config and decrypts its credentials per call; the organization arrives as NATS headers for RLS
@Controller()
export class PaymentIntentsController {
  private readonly logger = new Logger(PaymentIntentsController.name);

  constructor(private readonly lifecycle: PaymentLifecycleService) {}

  @MessagePattern({ cmd: 'payments.intents.create' })
  async create(@Payload() dto: CreatePaymentIntentDto): Promise<PaymentIntentDto> {
    this.logger.log(`intents.create — ${dto.referenceType}:${dto.referenceId}`);
    return this.lifecycle.create(dto);
  }

  @MessagePattern({ cmd: 'payments.intents.confirm' })
  async confirm(@Payload() dto: ConfirmPaymentIntentDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.confirm — ${dto.paymentIntentId}`);
    return this.lifecycle.confirm(dto);
  }

  @MessagePattern({ cmd: 'payments.intents.get' })
  async get(@Payload() dto: PaymentIntentRefDto): Promise<PaymentIntentDto> {
    return this.lifecycle.get(dto.paymentIntentId);
  }

  @MessagePattern({ cmd: 'payments.intents.cancel' })
  async cancel(@Payload() dto: PaymentIntentRefDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.cancel — ${dto.paymentIntentId}`);
    return this.lifecycle.cancel(dto.paymentIntentId);
  }

  @MessagePattern({ cmd: 'payments.intents.expireStale' })
  async expireStale(@Payload() dto: ExpireStaleIntentsDto): Promise<{ events: PaymentEventDto[] }> {
    return { events: await this.lifecycle.expireStale(dto.limit) };
  }

  @MessagePattern({ cmd: 'payments.intents.executeTransfers' })
  async executeTransfers(@Payload() dto: ExecuteTransfersDto): Promise<{ transfers: PaymentTransferDto[] }> {
    this.logger.log(`intents.executeTransfers — ${dto.paymentIntentId}`);
    return { transfers: await this.lifecycle.executeTransfers(dto) };
  }
}
