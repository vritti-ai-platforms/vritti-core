import { PaymentTermDto } from '@domain/payment-terms/dto/entity/payment-term.dto';
import { AddPaymentTermRuleDto } from '@domain/payment-terms/dto/request/add-payment-term-rule.dto';
import { CreatePaymentTermDto } from '@domain/payment-terms/dto/request/create-payment-term.dto';
import { UpdatePaymentTermDto } from '@domain/payment-terms/dto/request/update-payment-term.dto';
import { UpdatePaymentTermRuleDto } from '@domain/payment-terms/dto/request/update-payment-term-rule.dto';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class PaymentTermsController {
  private readonly logger = new Logger(PaymentTermsController.name);

  constructor(private readonly service: PaymentTermsDomainService) {}

  @MessagePattern({ cmd: 'org.paymentTerms.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PaymentTermDto[]; count: number }> {
    this.logger.log('paymentTerms.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.create' })
  async create(@Payload() dto: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermDto>> {
    this.logger.log(`paymentTerms.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.findById' })
  async findById(@Payload() data: { id: string }): Promise<PaymentTermDto> {
    this.logger.log(`paymentTerms.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.update' })
  async update(@Payload() dto: UpdatePaymentTermDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`paymentTerms.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.activate' })
  async activate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.activate — id: ${data.id}`);
    return this.service.activate(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.deactivate' })
  async deactivate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.deactivate — id: ${data.id}`);
    return this.service.deactivate(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.add' })
  async addRule(@Payload() dto: AddPaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.add — paymentTermId: ${dto.paymentTermId}`);
    return this.service.addRule(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.update' })
  async updateRule(@Payload() dto: UpdatePaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.update — id: ${dto.id}`);
    return this.service.updateRule(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.rules.delete' })
  async deleteRule(@Payload() data: { paymentTermId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.delete — id: ${data.id}`);
    return this.service.deleteRule(data.paymentTermId, data.id);
  }
}
