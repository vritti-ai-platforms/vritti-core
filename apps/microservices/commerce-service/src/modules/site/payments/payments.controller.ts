import type { PaymentDto } from '@domain/payments/dto/entity/payment.dto';
import { CreatePaymentDto } from '@domain/payments/dto/request/create-payment.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './services/payments.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly service: PaymentsService) {}

  @MessagePattern({ cmd: 'site.payments.create' })
  async create(@Payload() dto: CreatePaymentDto): Promise<PaymentDto> {
    this.logger.log(`payments.create — invoiceId: ${dto.invoiceId}`);
    return this.service.create(dto);
  }
}
