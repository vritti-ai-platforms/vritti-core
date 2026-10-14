import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import type { NewPaymentIntent, PaymentIntent } from '@/db/schema';
import { PaymentIntentDto } from '../dto/entity/payment-intent.dto';
import { PaymentIntentsDomainRepository } from '../repositories/payment-intents.repository';

@Injectable()
export class PaymentIntentsDomainService {
  private readonly logger = new Logger(PaymentIntentsDomainService.name);

  constructor(private readonly repository: PaymentIntentsDomainRepository) {}

  async findById(id: string): Promise<PaymentIntentDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Payment intent not found.');
    return PaymentIntentDto.from(entity);
  }

  // Internal lookup for webhook correlation — returns the row, not a DTO
  findByProviderOrderId(providerOrderId: string): Promise<PaymentIntent | undefined> {
    return this.repository.findByProviderOrderId(providerOrderId);
  }

  async create(data: NewPaymentIntent): Promise<CreateResponseDto<PaymentIntentDto>> {
    const entity = await this.repository.create(data);
    this.logger.log(`Created payment intent ${entity.id} (${entity.gatewayCode}, receipt ${entity.receipt})`);
    return { success: true, message: 'Payment intent created successfully.', data: PaymentIntentDto.from(entity) };
  }
}
