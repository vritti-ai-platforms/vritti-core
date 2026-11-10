import { PaymentTermDetailDto, PaymentTermDto } from '@domain/payment-terms/dto/entity/payment-term.dto';
import { ChangePaymentTermBaselineDto } from '@domain/payment-terms/dto/request/change-payment-term-baseline.dto';
import { CreatePaymentTermDto } from '@domain/payment-terms/dto/request/create-payment-term.dto';
import { UpdatePaymentTermDto } from '@domain/payment-terms/dto/request/update-payment-term.dto';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class PaymentTermsRootController {
  private readonly logger = new Logger(PaymentTermsRootController.name);

  constructor(private readonly service: PaymentTermsDomainService) {}

  @MessagePattern({ cmd: 'org.paymentTerms.table' })
  async table(@Payload() state: TableState): Promise<{ result: PaymentTermDto[]; count: number }> {
    this.logger.log('paymentTerms.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.create' })
  async create(@Payload() dto: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermDto>> {
    this.logger.log(`paymentTerms.create — name: ${dto.name}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.findById' })
  async findById(@Payload() data: { id: string }): Promise<PaymentTermDetailDto> {
    this.logger.log(`paymentTerms.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.update' })
  async update(@Payload() dto: UpdatePaymentTermDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`paymentTerms.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.changeBaseline' })
  async changeBaseline(@Payload() dto: ChangePaymentTermBaselineDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.changeBaseline — id: ${dto.id}`);
    return this.service.changeBaseline(dto.id, dto.baseline);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.publish' })
  async publish(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.publish — id: ${data.id}`);
    return this.service.publish(data.id);
  }

  @MessagePattern({ cmd: 'org.paymentTerms.unpublish' })
  async unpublish(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.unpublish — id: ${data.id}`);
    return this.service.unpublish(data.id);
  }
}
