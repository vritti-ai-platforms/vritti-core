import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import type { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { IntentWithEvents } from '../intent-with-events';
import {
  ConfirmPaymentIntentDto,
  CreatePaymentIntentDto,
  ExpireStaleIntentsDto,
  PaymentIntentRefDto,
  ReferenceIntentsDto,
  SyncPaymentIntentDto,
  TargetIntentsDto,
} from './dto/request/payment-intent-requests.dto';
import { PaymentIntentsRootService } from './services/payment-intents-root.service';

// Generic payment intents, for any caller that needs to take a payment. Reached only through core, which resolves
// the gateway config and decrypts its credentials per call; the organization arrives as NATS headers for RLS
@Controller()
export class PaymentIntentsRootController {
  private readonly logger = new Logger(PaymentIntentsRootController.name);

  constructor(private readonly service: PaymentIntentsRootService) {}

  @MessagePattern({ cmd: 'payments.intents.create' })
  async create(@Payload() dto: CreatePaymentIntentDto): Promise<PaymentIntentDto> {
    this.logger.log(`intents.create — ${dto.referenceType}:${dto.referenceId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'payments.intents.confirm' })
  async confirm(@Payload() dto: ConfirmPaymentIntentDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.confirm — ${dto.paymentIntentId}`);
    return this.service.confirm(dto);
  }

  // Asks the gateway whether the intent's order was paid and applies the answer, as its webhook would
  @MessagePattern({ cmd: 'payments.intents.sync' })
  async sync(@Payload() dto: SyncPaymentIntentDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.sync — ${dto.paymentIntentId}`);
    return this.service.sync(dto);
  }

  @MessagePattern({ cmd: 'payments.intents.get' })
  async get(@Payload() dto: PaymentIntentRefDto): Promise<PaymentIntentDto> {
    return this.service.get(dto.paymentIntentId);
  }

  // The intents opened for one target (a checkout, a point-of-sale sale), newest first
  @MessagePattern({ cmd: 'payments.intents.listByTarget' })
  async listByTarget(@Payload() dto: TargetIntentsDto): Promise<PaymentIntentDto[]> {
    return this.service.listByTarget(dto.targetId);
  }

  // The intents opened for one thing being paid for, newest first
  @MessagePattern({ cmd: 'payments.intents.listByReference' })
  async listByReference(@Payload() dto: ReferenceIntentsDto): Promise<PaymentIntentDto[]> {
    return this.service.listByReference(dto.referenceType, dto.referenceId);
  }

  @MessagePattern({ cmd: 'payments.intents.cancel' })
  async cancel(@Payload() dto: PaymentIntentRefDto): Promise<IntentWithEvents> {
    this.logger.log(`intents.cancel — ${dto.paymentIntentId}`);
    return this.service.cancel(dto.paymentIntentId);
  }

  @MessagePattern({ cmd: 'payments.intents.expireStale' })
  async expireStale(@Payload() dto: ExpireStaleIntentsDto): Promise<{ events: PaymentEventDto[] }> {
    return { events: await this.service.expireStale(dto.limit) };
  }
}
