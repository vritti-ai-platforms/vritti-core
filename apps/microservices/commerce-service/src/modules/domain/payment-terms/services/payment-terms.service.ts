import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type PaymentTerm, PaymentTermStatusValues, paymentTerms } from '@/db/schema';
import { PaymentTermDto } from '../dto/entity/payment-term.dto';
import type { AddPaymentTermRuleDto } from '../dto/request/add-payment-term-rule.dto';
import type { CreatePaymentTermDto } from '../dto/request/create-payment-term.dto';
import type { PaymentTermRuleFieldsDto } from '../dto/request/payment-term-rule-fields.dto';
import type { UpdatePaymentTermDto } from '../dto/request/update-payment-term.dto';
import type { UpdatePaymentTermRuleDto } from '../dto/request/update-payment-term-rule.dto';
import { PaymentTermsDomainRepository } from '../repositories/payment-terms.repository';

@Injectable()
export class PaymentTermsDomainService {
  private readonly logger = new Logger(PaymentTermsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: paymentTerms.name, type: 'string' },
    code: { column: paymentTerms.code, type: 'string' },
    baseline: { column: paymentTerms.baseline, type: 'string' },
    status: { column: paymentTerms.status, type: 'string' },
  };

  constructor(private readonly repository: PaymentTermsDomainRepository) {}

  // Returns paginated payment terms with their rules for the data table
  async findForTable(state: TableViewState): Promise<{ result: PaymentTermDto[]; count: number }> {
    const fieldMap = PaymentTermsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result: rows, count } = await this.repository.findAllAndCount({
      where: and(
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, fieldMap),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(paymentTerms.createdAt)],
      limit,
      offset,
    });
    const lines = await this.repository.findLines(rows.map((row) => row.id));
    return {
      result: rows.map((row) =>
        PaymentTermDto.from(
          row,
          lines.filter((line) => line.paymentTermId === row.id),
        ),
      ),
      count,
    };
  }

  // Returns active payment-term options so drafts and inactive terms cannot be picked; `includeAll` lists every
  // term for navigation (the breadcrumb switcher)
  findForSelect(query: SelectOptionsQueryDto, options?: { includeAll?: boolean }): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey || 'code',
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'name',
        orderDirection: query.orderDirection || 'asc',
      },
      options,
    );
  }

  async findById(id: string): Promise<PaymentTermDto> {
    const entity = await this.findOrThrow(id);
    return PaymentTermDto.from(entity, await this.repository.findLines([id]));
  }

  // Creates a draft payment term; rules are added next and the term is activated once they total 100%
  async create(data: CreatePaymentTermDto): Promise<CreateResponseDto<PaymentTermDto>> {
    if (await this.repository.findByCode(data.code)) {
      throw new ConflictException({
        label: 'Code already exists',
        detail: `A payment term with code "${data.code}" already exists.`,
        errors: [{ field: 'code', message: 'Already in use' }],
      });
    }
    const entity = await this.repository.create({
      code: data.code,
      name: data.name,
      baseline: data.baseline,
      description: data.description ?? null,
      status: PaymentTermStatusValues.DRAFT,
    });
    this.logger.log(`Created payment term: ${entity.code}`);
    return {
      success: true,
      message: `Payment term "${entity.name}" created as a draft.`,
      data: PaymentTermDto.from(entity, []),
    };
  }

  // Updates name and description at any time; the baseline changes due dates, so only a draft may change it
  async update(id: string, data: Omit<UpdatePaymentTermDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.findOrThrow(id);
    if (data.baseline && data.baseline !== existing.baseline) PaymentTermsDomainService.assertDraft(existing);
    if (Object.keys(data).length > 0) await this.repository.update(id, data);
    this.logger.log(`Updated payment term: ${existing.code} (${id})`);
    return { success: true, message: `Payment term "${data.name ?? existing.name}" updated successfully.` };
  }

  async addRule(data: AddPaymentTermRuleDto): Promise<SuccessResponseDto> {
    const term = await this.findOrThrow(data.paymentTermId);
    PaymentTermsDomainService.assertDraft(term);
    PaymentTermsDomainService.assertRule(data);
    await this.repository.addLine(term.id, PaymentTermsDomainService.toRuleRow(data));
    return { success: true, message: 'Rule added.' };
  }

  async updateRule(data: UpdatePaymentTermRuleDto): Promise<SuccessResponseDto> {
    const term = await this.findOrThrow(data.paymentTermId);
    PaymentTermsDomainService.assertDraft(term);
    if (!(await this.repository.findLine(term.id, data.id))) throw new NotFoundException('Rule not found.');
    PaymentTermsDomainService.assertRule(data);
    await this.repository.updateLine(data.id, PaymentTermsDomainService.toRuleRow(data));
    return { success: true, message: 'Rule updated.' };
  }

  async deleteRule(paymentTermId: string, id: string): Promise<SuccessResponseDto> {
    const term = await this.findOrThrow(paymentTermId);
    PaymentTermsDomainService.assertDraft(term);
    if (!(await this.repository.findLine(term.id, id))) throw new NotFoundException('Rule not found.');
    await this.repository.deleteLine(id);
    return { success: true, message: 'Rule deleted.' };
  }

  // Activates a draft or inactive term once it has at least one rule and its rules total exactly 100%
  async activate(id: string): Promise<SuccessResponseDto> {
    const term = await this.findOrThrow(id);
    if (term.status === PaymentTermStatusValues.ACTIVE) {
      return { success: true, message: `Payment term "${term.name}" is already active.` };
    }
    const lines = await this.repository.findLines([id]);
    if (lines.length === 0) {
      throw new BadRequestException({
        label: 'No rules',
        detail: 'Add at least one rule before activating this payment term.',
      });
    }
    const total = lines.reduce((sum, line) => sum.plus(line.percent), new Decimal(0));
    if (!total.equals(100)) {
      throw new BadRequestException({
        label: 'Rules must total 100%',
        detail: `The rules add up to ${total.toString()}% of the invoice. Adjust them to total exactly 100%.`,
      });
    }
    await this.repository.update(id, { status: PaymentTermStatusValues.ACTIVE });
    this.logger.log(`Activated payment term: ${term.code} (${id})`);
    return { success: true, message: `Payment term "${term.name}" is now active.` };
  }

  // Hides an active term from selectors; suppliers and enrollments already on it keep it
  async deactivate(id: string): Promise<SuccessResponseDto> {
    const term = await this.findOrThrow(id);
    if (term.status !== PaymentTermStatusValues.ACTIVE) {
      throw new BadRequestException({
        label: 'Not active',
        detail: 'Only an active payment term can be deactivated.',
      });
    }
    await this.repository.update(id, { status: PaymentTermStatusValues.INACTIVE });
    this.logger.log(`Deactivated payment term: ${term.code} (${id})`);
    return { success: true, message: `Payment term "${term.name}" is now inactive.` };
  }

  // Deletes a payment term that no supplier or site enrollment uses
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.findOrThrow(id);
    const usage = await this.repository.countUsage(id);
    if (usage.suppliers > 0 || usage.enrollments > 0) {
      throw new ConflictException({
        label: 'Payment term in use',
        detail: `"${existing.name}" is the default for ${pluralize('supplier', usage.suppliers, true)} and applies to ${pluralize('site enrollment', usage.enrollments, true)}. Deactivate it instead.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted payment term: ${existing.code} (${id})`);
    return { success: true, message: `Payment term "${existing.name}" deleted successfully.` };
  }

  private async findOrThrow(id: string): Promise<PaymentTerm> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Payment term not found.');
    return entity;
  }

  // Rules change only while the term is a draft; active terms are already in use
  private static assertDraft(term: PaymentTerm): void {
    if (term.status === PaymentTermStatusValues.DRAFT) return;
    throw new BadRequestException({
      label: 'Payment term is not a draft',
      detail: 'Rules and the baseline can only change while the payment term is a draft. Create a new term instead.',
    });
  }

  // A discount needs both its percentage and its window, and must be taken on or before the rule falls due
  private static assertRule(rule: PaymentTermRuleFieldsDto): void {
    const hasPercent = rule.discountPercent != null;
    const hasDays = rule.discountDays != null;
    if (hasPercent !== hasDays) {
      throw new BadRequestException({
        label: 'Incomplete discount',
        detail: 'An early-payment discount needs both a percentage and a number of days.',
        errors: [{ field: hasPercent ? 'discountDays' : 'discountPercent', message: 'Required' }],
      });
    }
    if (hasDays && (rule.discountDays ?? 0) > rule.dueDays) {
      throw new BadRequestException({
        label: 'Discount window too long',
        detail: 'The discount must be taken on or before the rule falls due.',
        errors: [{ field: 'discountDays', message: 'Must not exceed the due days' }],
      });
    }
  }

  private static toRuleRow(rule: PaymentTermRuleFieldsDto) {
    return {
      percent: rule.percent,
      dueDays: rule.dueDays,
      discountPercent: rule.discountPercent ?? null,
      discountDays: rule.discountDays ?? null,
    };
  }
}
