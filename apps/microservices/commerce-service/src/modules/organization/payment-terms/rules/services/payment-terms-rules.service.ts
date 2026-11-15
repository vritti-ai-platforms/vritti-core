import type { PaymentScheduleDto } from '@domain/payment-term-rules/dto/entity/payment-schedule.dto';
import type { PaymentTermRulesDto } from '@domain/payment-term-rules/dto/entity/payment-term-rule.dto';
import type { AddPaymentTermRuleDto } from '@domain/payment-term-rules/dto/request/add-payment-term-rule.dto';
import type { PreviewPaymentScheduleDto } from '@domain/payment-term-rules/dto/request/preview-payment-schedule.dto';
import type { UpdatePaymentTermRuleDto } from '@domain/payment-term-rules/dto/request/update-payment-term-rule.dto';
import { PaymentTermRulesDomainService } from '@domain/payment-term-rules/services/payment-term-rules.service';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

// Org-scope rules of a payment term: loads the term from its domain (a draft for any change), then hands it to the
// rules domain as context
@Injectable()
export class PaymentTermsRulesService {
  constructor(
    private readonly termsService: PaymentTermsDomainService,
    private readonly rulesService: PaymentTermRulesDomainService,
  ) {}

  async findAll(paymentTermId: string): Promise<PaymentTermRulesDto> {
    const term = await this.termsService.findByIdOrThrow(paymentTermId);
    return this.rulesService.findByTerm(term.id);
  }

  async add(data: AddPaymentTermRuleDto): Promise<SuccessResponseDto> {
    const term = await this.termsService.findDraftOrThrow(data.paymentTermId);
    return this.rulesService.add(term, data);
  }

  async update(data: UpdatePaymentTermRuleDto): Promise<SuccessResponseDto> {
    const term = await this.termsService.findDraftOrThrow(data.paymentTermId);
    return this.rulesService.update(term, data);
  }

  async delete(paymentTermId: string, id: string): Promise<SuccessResponseDto> {
    const term = await this.termsService.findDraftOrThrow(paymentTermId);
    return this.rulesService.delete(term, id);
  }

  async previewSchedule(data: PreviewPaymentScheduleDto): Promise<PaymentScheduleDto> {
    const term = await this.termsService.findByIdOrThrow(data.paymentTermId);
    return this.rulesService.previewSchedule(term, data);
  }
}
