import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { allocate, CurrencyAmountDto, dinero, majorToMinor, resolveCurrency, toSnapshot } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type PaymentTerm, PaymentTermBaselineValues } from '@/db/schema';
import type { PaymentScheduleDto } from '../dto/entity/payment-schedule.dto';
import { PaymentTermRulesDto } from '../dto/entity/payment-term-rule.dto';
import type { PaymentTermRuleFieldsDto } from '../dto/request/payment-term-rule-fields.dto';
import type { PreviewPaymentScheduleDto } from '../dto/request/preview-payment-schedule.dto';
import type { UpdatePaymentTermRuleDto } from '../dto/request/update-payment-term-rule.dto';
import { PaymentTermRulesDomainRepository } from '../repositories/payment-term-rules.repository';

// The term a rule belongs to, fetched (and checked editable where it must be) by the caller
export type PaymentTermContext = Pick<PaymentTerm, 'id' | 'baseline'>;

@Injectable()
export class PaymentTermRulesDomainService {
  constructor(private readonly repository: PaymentTermRulesDomainRepository) {}

  async add(term: PaymentTermContext, data: PaymentTermRuleFieldsDto): Promise<SuccessResponseDto> {
    this.repository.assertValid(data);
    await this.repository.assertDueDayFree(term.id, data.dueDays);
    await this.repository.addRule(term.id, data);
    return { success: true, message: 'Rule added.' };
  }

  async update(term: PaymentTermContext, data: UpdatePaymentTermRuleDto): Promise<SuccessResponseDto> {
    this.repository.assertValid(data);
    await this.repository.assertEditable(term.id, data.id, data.dueDays);
    await this.repository.updateRule(data.id, data);
    return { success: true, message: 'Rule updated.' };
  }

  async findByTerm(paymentTermId: string): Promise<PaymentTermRulesDto> {
    return PaymentTermRulesDto.from(await this.repository.findByTerm(paymentTermId));
  }

  // Returns the date a number of days after the term's baseline for a document dated `date` (YYYY-MM-DD): the date
  // itself, or the end of its month
  dueDateAfter(term: PaymentTermContext, date: string, days: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const baselineTime =
      term.baseline === PaymentTermBaselineValues.END_OF_MONTH
        ? Date.UTC(year, month, 0)
        : Date.UTC(year, month - 1, day);
    return new Date(baselineTime + days * 86_400_000).toISOString().slice(0, 10);
  }

  // Returns when a document dated `date` falls fully due under the term: its last instalment, or the baseline with no rules
  async findFinalDueDate(term: PaymentTermContext, date: string): Promise<string> {
    const rules = await this.repository.findByTerm(term.id);
    return this.dueDateAfter(term, date, Math.max(0, ...rules.map((rule) => rule.dueDays)));
  }

  // Applies the term's rules to a sample invoice. Shares are allocated in basis points so rounding remainders land on
  // the instalments and they always sum to the invoice; due dates and discount deadlines count from the baseline date
  async previewSchedule(term: PaymentTermContext, data: PreviewPaymentScheduleDto): Promise<PaymentScheduleDto> {
    const rules = await this.repository.findByTerm(term.id);
    const totalMinor = majorToMinor(data.amount, data.currency, 'amount');
    if (totalMinor <= 0n) {
      throw new BadRequestException({
        label: 'Invalid amount',
        detail: 'The invoice amount must be greater than zero.',
        errors: [{ field: 'amount', message: 'Must be greater than zero' }],
      });
    }

    const ruleBasisPoints = rules.map((rule) => BigInt(new Decimal(rule.percent).mul(100).toFixed(0)));
    const allocatedBasisPoints = ruleBasisPoints.reduce((sum, points) => sum + points, 0n);
    if (allocatedBasisPoints > 10_000n) {
      throw new BadRequestException({
        label: 'Rules exceed 100%',
        detail:
          'The rules add up to more than 100% of the invoice. Bring them to 100% or less to preview the schedule.',
      });
    }
    const shares = allocate(dinero({ amount: totalMinor, currency: resolveCurrency(data.currency) }), [
      ...ruleBasisPoints,
      10_000n - allocatedBasisPoints,
    ]).map((share) => toSnapshot(share).amount);

    const dateAfter = (days: number) => this.dueDateAfter(term, data.date, days);
    const money = (minor: bigint) => CurrencyAmountDto.from(minor, data.currency);

    let allocatedMinor = 0n;
    let savingsMinor = 0n;
    const instalments = rules.map((rule, index) => {
      const amountMinor = shares[index];
      allocatedMinor += amountMinor;
      if (rule.discountPercent == null || rule.discountDays == null) {
        return {
          ruleId: rule.id,
          percent: Number(rule.percent),
          dueDays: rule.dueDays,
          dueDate: dateAfter(rule.dueDays),
          amount: money(amountMinor),
          discount: null,
        };
      }
      const discountMinor = BigInt(
        new Decimal(amountMinor.toString()).mul(rule.discountPercent).div(100).toFixed(0, Decimal.ROUND_HALF_UP),
      );
      savingsMinor += discountMinor;
      return {
        ruleId: rule.id,
        percent: Number(rule.percent),
        dueDays: rule.dueDays,
        dueDate: dateAfter(rule.dueDays),
        amount: money(amountMinor),
        discount: {
          percent: Number(rule.discountPercent),
          days: rule.discountDays,
          payBy: dateAfter(rule.discountDays),
          amount: money(discountMinor),
          payable: money(amountMinor - discountMinor),
        },
      };
    });

    return {
      baseline: term.baseline,
      baselineDate: dateAfter(0),
      total: money(totalMinor),
      allocated: money(allocatedMinor),
      unallocated: money(totalMinor - allocatedMinor),
      maxSavings: money(savingsMinor),
      instalments,
    };
  }

  async delete(term: PaymentTermContext, id: string): Promise<SuccessResponseDto> {
    await this.repository.deleteOrThrow(term.id, id);
    return { success: true, message: 'Rule deleted.' };
  }
}
