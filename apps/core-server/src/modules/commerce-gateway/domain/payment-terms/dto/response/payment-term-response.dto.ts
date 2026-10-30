import { ApiProperty } from '@nestjs/swagger';

export const PAYMENT_TERM_BASELINES = ['INVOICE_DATE', 'GOODS_RECEIPT_DATE', 'END_OF_MONTH'] as const;
export type PaymentTermBaseline = (typeof PAYMENT_TERM_BASELINES)[number];

export const PAYMENT_TERM_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const;
export type PaymentTermStatus = (typeof PAYMENT_TERM_STATUSES)[number];

export class PaymentTermLineResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'Position within the term' })
  sortOrder: number;

  @ApiProperty({ description: 'Share of the invoice this rule makes due', example: 100 })
  percent: number;

  @ApiProperty({ description: 'Days after the baseline date the rule falls due', example: 30 })
  dueDays: number;

  @ApiProperty({ description: 'Early-payment discount percentage', type: Number, nullable: true })
  discountPercent: number | null;

  @ApiProperty({ description: 'Days the discount stays available', type: Number, nullable: true })
  discountDays: number | null;
}

export class PaymentTermResponseDto {
  @ApiProperty({ description: 'Payment term ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the org', example: 'net-30' })
  code: string;

  @ApiProperty({ description: 'Human-readable name', example: 'Net 30' })
  name: string;

  @ApiProperty({ description: 'Date the due days count from', enum: PAYMENT_TERM_BASELINES })
  baseline: PaymentTermBaseline;

  @ApiProperty({ description: 'Internal description', type: String, nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Draft terms are being set up; only active terms can be picked',
    enum: PAYMENT_TERM_STATUSES,
  })
  status: PaymentTermStatus;

  @ApiProperty({
    description: 'Readable form of the rules',
    example: '2% 10 days, Net 30',
    type: String,
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({ description: 'Sum of the rule percentages; must be 100 to activate', example: 100 })
  totalPercent: number;

  @ApiProperty({ type: [PaymentTermLineResponseDto] })
  lines: PaymentTermLineResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
