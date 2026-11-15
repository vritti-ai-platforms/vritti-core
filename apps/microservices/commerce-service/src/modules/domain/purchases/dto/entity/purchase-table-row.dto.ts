import Decimal from '@vritti/api-sdk/decimal';
import _ from '@vritti/api-sdk/lodash';
import { type PurchaseStatus, type PurchaseStep, PurchaseStepValues } from '@/db/schema';
import type { PurchaseProgressItemRow, PurchaseTableRow } from '../../repositories/purchases.repository';

export interface PurchaseProgressSegments {
  invoiced: number;
  received: number;
  inTransit: number;
  ordered: number;
  allocated: number;
  unallocated: number;
}

export interface PurchaseProgressQuotations {
  posted: number;
  needed: number;
}

interface PurchaseProgressBase {
  itemCount: number;
  segments: PurchaseProgressSegments;
}

// Quotations are counted only while the purchase is Quoting
export type PurchaseProgress =
  | (PurchaseProgressBase & { stage: typeof PurchaseStepValues.QUOTING; quotations: PurchaseProgressQuotations })
  | (PurchaseProgressBase & {
      stage: Exclude<PurchaseStep, typeof PurchaseStepValues.QUOTING>;
      quotations: null;
    });

type ProgressSegment = keyof PurchaseProgressSegments;

type PipelineSegment = Exclude<ProgressSegment, 'unallocated'>;

const PIPELINE_SEGMENTS: PipelineSegment[] = ['invoiced', 'received', 'inTransit', 'ordered', 'allocated'];

// Splits one item's requested quantity into the fraction each segment holds; a segment's level is the quantity that
// reached it capped at the request and never below a later segment's, so the fractions are non-negative and sum to one
function itemFractions(item: PurchaseProgressItemRow): Record<ProgressSegment, Decimal> {
  const requested = new Decimal(item.requested);
  const level = (quantity: Decimal.Value, later: Decimal) => Decimal.max(Decimal.min(quantity, requested), later);
  const invoiced = level(item.invoiced, new Decimal(0));
  const received = level(item.received, invoiced);
  const inTransit = level(new Decimal(item.received).plus(item.inTransit), received);
  const ordered = level(item.ordered, inTransit);
  const allocated = level(item.allocated, ordered);
  return {
    invoiced: invoiced.dividedBy(requested),
    received: received.minus(invoiced).dividedBy(requested),
    inTransit: inTransit.minus(received).dividedBy(requested),
    ordered: ordered.minus(inTransit).dividedBy(requested),
    allocated: allocated.minus(ordered).dividedBy(requested),
    unallocated: requested.minus(allocated).dividedBy(requested),
  };
}

// Averages the items' fractions into percentages to one decimal; the unallocated track absorbs the rounding so the
// segments sum to exactly 100, and a rounding overshoot comes off the largest segment
function progressSegments(items: PurchaseProgressItemRow[]): PurchaseProgressSegments {
  const fractions = items.filter((item) => item.requested > 0).map(itemFractions);
  if (fractions.length === 0) {
    return { invoiced: 0, received: 0, inTransit: 0, ordered: 0, allocated: 0, unallocated: 100 };
  }
  const percent = (segment: PipelineSegment) =>
    Decimal.sum(...fractions.map((item) => item[segment]))
      .dividedBy(fractions.length)
      .times(100)
      .toDecimalPlaces(1, Decimal.ROUND_HALF_UP);
  const pipeline = _.zipObject(PIPELINE_SEGMENTS, PIPELINE_SEGMENTS.map(percent)) as Record<PipelineSegment, Decimal>;
  const overshoot = Decimal.sum(...Object.values(pipeline)).minus(100);
  if (overshoot.isPositive()) {
    const largest = _.maxBy(PIPELINE_SEGMENTS, (segment) => pipeline[segment].toNumber()) as PipelineSegment;
    pipeline[largest] = pipeline[largest].minus(overshoot);
  }
  return {
    ..._.mapValues(pipeline, (value) => value.toNumber()),
    unallocated: new Decimal(100).minus(Decimal.sum(...Object.values(pipeline))).toNumber(),
  };
}

// Shapes a purchase's progress through its step; only QUOTING reports its posted quotations against the minimum
export function purchaseProgress(row: PurchaseTableRow): PurchaseProgress {
  const base = { itemCount: row.itemCount, segments: progressSegments(row.progress.items) };
  if (row.step === PurchaseStepValues.QUOTING) {
    return {
      ...base,
      stage: row.step,
      quotations: { posted: row.progress.postedSuppliers ?? 0, needed: row.minQuotations },
    };
  }
  return { ...base, stage: row.step, quotations: null };
}

export class PurchaseTableRowDto {
  id: string;
  purchaseNumber: string;
  step: PurchaseStep;
  status: PurchaseStatus;
  siteId: string;
  itemCount: number;
  progress: PurchaseProgress;
  createdAt: string;

  // Shapes a purchase row with its progress through its step
  static from(row: PurchaseTableRow): PurchaseTableRowDto {
    const dto = new PurchaseTableRowDto();
    dto.id = row.id;
    dto.purchaseNumber = row.purchaseNumber;
    dto.step = row.step;
    dto.status = row.status;
    dto.siteId = row.siteId;
    dto.itemCount = row.itemCount;
    dto.progress = purchaseProgress(row);
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
