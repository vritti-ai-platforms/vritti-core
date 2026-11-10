import type { ChangePaymentTermBaselineDto } from '@commerce/payment-terms/dto/request/change-payment-term-baseline.dto';
import type { CreatePaymentTermDto } from '@commerce/payment-terms/dto/request/create-payment-term.dto';
import type { PaymentScheduleQueryDto } from '@commerce/payment-terms/dto/request/payment-schedule-query.dto';
import type { PaymentTermRuleDto } from '@commerce/payment-terms/dto/request/payment-term-rule.dto';
import type { UpdatePaymentTermDto } from '@commerce/payment-terms/dto/request/update-payment-term.dto';
import type { PaymentScheduleResponseDto } from '@commerce/payment-terms/dto/response/payment-schedule-response.dto';
import type {
  PaymentTermDetailResponseDto,
  PaymentTermResponseDto,
  PaymentTermRulesResponseDto,
} from '@commerce/payment-terms/dto/response/payment-term-response.dto';
import type { PaymentTermTableResponseDto } from '@commerce/payment-terms/dto/response/payment-term-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class PaymentTermsGatewayService {
  private readonly logger = new Logger(PaymentTermsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Returns paginated, filtered, and sorted payment terms for the data table
  async findForTable(userId: string): Promise<PaymentTermTableResponseDto> {
    this.logger.log('org.paymentTerms.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-payment-terms');

    const { result, count } = await this.nats.send<{ result: PaymentTermResponseDto[]; count: number }>(
      'commerce',
      'org.paymentTerms.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new payment term
  create(dto: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermResponseDto>> {
    this.logger.log(`paymentTerms.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'org.paymentTerms.create', dto);
  }

  // Finds a payment term by ID
  findById(id: string): Promise<PaymentTermDetailResponseDto> {
    this.logger.log(`paymentTerms.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.findById', { id });
  }

  // Updates a payment term by ID
  update(id: string, dto: UpdatePaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.update — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.update', { id, ...dto });
  }

  // Deletes a payment term by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.delete', { id });
  }

  changeBaseline(id: string, dto: ChangePaymentTermBaselineDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.changeBaseline — id: ${id}, baseline: ${dto.baseline}`);
    return this.nats.send('commerce', 'org.paymentTerms.changeBaseline', { ...dto, id });
  }

  publish(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.publish — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.publish', { id });
  }

  unpublish(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.unpublish — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.unpublish', { id });
  }

  findRules(paymentTermId: string): Promise<PaymentTermRulesResponseDto> {
    this.logger.log(`paymentTerms.rules.findAll — paymentTermId: ${paymentTermId}`);
    return this.nats.send('commerce', 'org.paymentTerms.rules.findAll', { paymentTermId });
  }

  previewSchedule(paymentTermId: string, query: PaymentScheduleQueryDto): Promise<PaymentScheduleResponseDto> {
    this.logger.log(`paymentTerms.rules.previewSchedule — paymentTermId: ${paymentTermId}`);
    return this.nats.send('commerce', 'org.paymentTerms.rules.previewSchedule', { ...query, paymentTermId });
  }

  addRule(paymentTermId: string, dto: PaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.add — paymentTermId: ${paymentTermId}`);
    return this.nats.send('commerce', 'org.paymentTerms.rules.add', { ...dto, paymentTermId });
  }

  updateRule(paymentTermId: string, id: string, dto: PaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.update — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.rules.update', { ...dto, paymentTermId, id });
  }

  deleteRule(paymentTermId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`paymentTerms.rules.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.paymentTerms.rules.delete', { paymentTermId, id });
  }
}
