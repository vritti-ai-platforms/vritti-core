import type { PaymentScheduleDto } from '@domain/payment-term-rules/dto/entity/payment-schedule.dto';
import type { PaymentTermRulesDto } from '@domain/payment-term-rules/dto/entity/payment-term-rule.dto';
import { AddPaymentTermRuleDto } from '@domain/payment-term-rules/dto/request/add-payment-term-rule.dto';
import { PreviewPaymentScheduleDto } from '@domain/payment-term-rules/dto/request/preview-payment-schedule.dto';
import { UpdatePaymentTermRuleDto } from '@domain/payment-term-rules/dto/request/update-payment-term-rule.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PaymentTermsRulesService } from './services/payment-terms-rules.service';

@Controller()
export class PaymentTermsRulesController {
  private readonly logger = new Logger(PaymentTermsRulesController.name);

  constructor(private readonly service: PaymentTermsRulesService) {}

  @MessagePattern({ cmd: 'org.paymentTerms.rules.add' })
  async add(@Payload() dto: AddPaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.add — paymentTermId: ${dto.paymentTermId}`);
    return this.service.add(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.update' })
  async update(@Payload() dto: UpdatePaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.findAll' })
  async findAll(@Payload() data: { paymentTermId: string }): Promise<PaymentTermRulesDto> {
    this.logger.log(`paymentTerms.rules.findAll — paymentTermId: ${data.paymentTermId}`);
    return this.service.findAll(data.paymentTermId);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.previewSchedule' })
  async previewSchedule(@Payload() dto: PreviewPaymentScheduleDto): Promise<PaymentScheduleDto> {
    this.logger.log(`paymentTerms.rules.previewSchedule — paymentTermId: ${dto.paymentTermId}`);
    return this.service.previewSchedule(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.delete' })
  async delete(@Payload() data: { paymentTermId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.delete — id: ${data.id}`);
    return this.service.delete(data.paymentTermId, data.id);
  }
}
