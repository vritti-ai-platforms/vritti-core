import type { PaymentDto } from '@domain/payments/dto/entity/payment.dto';
import { PaymentsService } from '@domain/payments/services/payments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreatePaymentDto } from './dto/request/create-payment.dto';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly service: PaymentsService) {}

  @MessagePattern({ cmd: 'payments.create' })
  async create(@Payload() dto: CreatePaymentDto): Promise<PaymentDto> {
    this.logger.log(`payments.create — invoiceId: ${dto.invoiceId}`);
    return this.service.createPayment(dto);
  }
}
