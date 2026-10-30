import Decimal from '@vritti/api-sdk/decimal';
import type { PaymentTerm, PaymentTermBaseline, PaymentTermLine, PaymentTermStatus } from '@/db/schema';

export class PaymentTermLineDto {
  id: string;
  sortOrder: number;
  percent: number;
  dueDays: number;
  discountPercent: number | null;
  discountDays: number | null;

  static from(entity: PaymentTermLine): PaymentTermLineDto {
    const dto = new PaymentTermLineDto();
    dto.id = entity.id;
    dto.sortOrder = entity.sortOrder;
    dto.percent = Number(entity.percent);
    dto.dueDays = entity.dueDays;
    dto.discountPercent = entity.discountPercent == null ? null : Number(entity.discountPercent);
    dto.discountDays = entity.discountDays ?? null;
    return dto;
  }
}

const BASELINE_SUFFIX: Record<PaymentTermBaseline, string> = {
  INVOICE_DATE: '',
  GOODS_RECEIPT_DATE: ' from receipt',
  END_OF_MONTH: ' after month end',
};

// "Net 30", "2% 10 days, Net 45", "50% in 30 days, 50% in 60 days" — the readable form selects and tables show
export function summarizePaymentTerm(baseline: PaymentTermBaseline, lines: PaymentTermLineDto[]): string | null {
  if (lines.length === 0) return null;
  const suffix = BASELINE_SUFFIX[baseline];
  if (lines.length === 1) {
    const [line] = lines;
    const net = line.dueDays === 0 && !suffix ? 'Due immediately' : `Net ${line.dueDays}${suffix}`;
    return line.discountPercent != null ? `${line.discountPercent}% ${line.discountDays} days, ${net}` : net;
  }
  return lines
    .map((line) => {
      const part = `${line.percent}% in ${line.dueDays} days${suffix}`;
      return line.discountPercent != null ? `${part} (${line.discountPercent}% if within ${line.discountDays})` : part;
    })
    .join(', ');
}

export class PaymentTermDto {
  id: string;
  code: string;
  name: string;
  baseline: PaymentTermBaseline;
  description: string | null;
  status: PaymentTermStatus;
  summary: string | null;
  totalPercent: number;
  lines: PaymentTermLineDto[];
  createdAt: string;
  updatedAt: string;

  static from(entity: PaymentTerm, lines: PaymentTermLine[]): PaymentTermDto {
    const dto = new PaymentTermDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.baseline = entity.baseline;
    dto.description = entity.description ?? null;
    dto.status = entity.status;
    dto.lines = [...lines]
      .sort((a, b) => a.dueDays - b.dueDays || a.sortOrder - b.sortOrder)
      .map(PaymentTermLineDto.from);
    dto.totalPercent = Number(dto.lines.reduce((sum, line) => sum.plus(line.percent), new Decimal(0)).toFixed(2));
    dto.summary = summarizePaymentTerm(entity.baseline, dto.lines);
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
