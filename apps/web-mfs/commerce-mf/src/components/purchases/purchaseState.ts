import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import Decimal from '@vritti/quantum-ui/decimal';
import type { Formatters } from '@vritti/quantum-ui/hooks';
import { uniq } from '@vritti/quantum-ui/lodash';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import {
  PurchaseActionValues,
  type PurchaseFlowStepState,
  PurchaseFlowStepStateValues,
  type PurchaseHeader,
  type PurchaseLeg,
  type PurchaseLegFlowStep,
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  type PurchaseProgress,
  type PurchaseProgressSegments,
  type PurchaseQuotation,
  type PurchaseSourcingItem,
  PurchaseStatusValues,
  type PurchaseStep,
  PurchaseStepValues,
  type PurchaseTableRow,
  purchaseLegStepConfig,
  purchaseTypeConfig,
} from '@/schemas/purchases';

export interface PurchaseBadgeState {
  label: string;
  variant: BadgeProps['variant'];
}

export interface PurchaseStageEntry {
  step: PurchaseStep;
  state: PurchaseFlowStepState;
  isSkipped: boolean;
  isViewable: boolean;
}

// The progress bar's stages in pipeline order (lightest to darkest), and the grey track for the rest
export const PURCHASE_PROGRESS: {
  track: { key: 'unallocated'; label: string };
  segments: { key: Exclude<keyof PurchaseProgressSegments, 'unallocated'>; label: string }[];
} = {
  track: { key: 'unallocated', label: 'Not allocated' },
  segments: [
    { key: 'allocated', label: 'Allocated' },
    { key: 'ordered', label: 'Ordered' },
    { key: 'inTransit', label: 'In transit' },
    { key: 'received', label: 'Received' },
    { key: 'invoiced', label: 'Invoiced' },
  ],
};

const STAGE_ORDER: PurchaseStep[] = [
  PurchaseStepValues.REQUESTING,
  PurchaseStepValues.QUOTING,
  PurchaseStepValues.SOURCING,
  PurchaseStepValues.PROCURING,
];

// The purchase's item count, followed by how far its stage has got
export function purchaseProgressCaption(
  { stage, itemCount, quotations, segments }: PurchaseProgress,
  fmt: Formatters,
): string {
  const items = pluralize('item', itemCount, true);
  switch (stage) {
    case PurchaseStepValues.REQUESTING:
      return items;
    case PurchaseStepValues.QUOTING:
      return `${items} · ${quotations.posted} of ${pluralize('quotation', quotations.needed, true)}`;
    case PurchaseStepValues.SOURCING:
      return `${items} · ${fmt.percent(100 - segments.unallocated).primary} allocated`;
    case PurchaseStepValues.PROCURING:
      return `${items} · ${fmt.percent(segments.received + segments.invoiced).primary} received`;
  }
}

// What an open procuring purchase still waits on: goods while any are allocated, ordered or in transit, then invoices
export function purchaseStageTip({
  step,
  status,
  progress,
}: Pick<PurchaseTableRow, 'step' | 'status' | 'progress'>): string | undefined {
  if (status !== PurchaseStatusValues.OPEN || step !== PurchaseStepValues.PROCURING) return undefined;
  const { allocated, ordered, inTransit, received } = progress.segments;
  if (allocated + ordered + inTransit > 0) return 'Waiting for goods';
  if (received > 0) return 'Waiting for invoices';
  return undefined;
}

// The stages a purchase walks — Quoting skipped when it collects no quotations — each done, current or ahead; the
// current one and those behind it can be opened, and a completed purchase has every stage done
export function purchaseStages(
  purchase: Pick<PurchaseHeader, 'step' | 'status' | 'quotationsRequired'>,
): PurchaseStageEntry[] {
  const currentIndex = STAGE_ORDER.indexOf(purchase.step);
  const isCompleted = purchase.status === PurchaseStatusValues.COMPLETED;
  return STAGE_ORDER.map((step, index) => {
    const isSkipped = step === PurchaseStepValues.QUOTING && !purchase.quotationsRequired;
    let state: PurchaseFlowStepState = PurchaseFlowStepStateValues.UPCOMING;
    if (index < currentIndex || (isCompleted && index === currentIndex)) state = PurchaseFlowStepStateValues.DONE;
    else if (index === currentIndex) state = PurchaseFlowStepStateValues.CURRENT;
    return { step, state, isSkipped, isViewable: !isSkipped && index <= currentIndex };
  });
}

// Whether a stage's view only shows what happened: every stage of a completed or cancelled purchase, and every stage
// behind an open one's — except Sourcing while allocations stay open in Procuring for suppliers sent back to sourcing
export function isStageReadOnly(
  purchase: Pick<PurchaseHeader, 'step' | 'status' | 'availableActions'>,
  stage: PurchaseStep,
) {
  if (purchase.status !== PurchaseStatusValues.OPEN) return true;
  if (stage === purchase.step) return false;
  return !(
    stage === PurchaseStepValues.SOURCING && purchase.availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS)
  );
}

// A supplier leg's badge: closed or cancelled, back in sourcing (rejected or not), awaiting approval, or its next step
export function purchaseLegState(
  { step, status }: Pick<PurchaseLeg, 'step' | 'status'>,
  rejected = false,
): PurchaseBadgeState {
  if (status === PurchaseLegStatusValues.CANCELLED) return { label: 'Cancelled', variant: 'destructive' };
  if (status === PurchaseLegStatusValues.CLOSED) return { label: 'Closed', variant: 'secondary' };
  if (step === PurchaseLegStepValues.SOURCING && rejected) return { label: 'Rejected', variant: 'destructive' };
  if (step === PurchaseLegStepValues.SOURCING) return { label: 'Sourcing', variant: 'outline' };
  if (step === PurchaseLegStepValues.APPROVAL) return { label: 'Awaiting Approval', variant: 'warning' };
  return { label: purchaseLegStepConfig[step].label, variant: 'success' };
}

// A leg's full flow — approval when enabled, its type's steps, then closed — with the steps behind it done and the one
// it is at current; nothing has started while it is in sourcing, and a closed leg has every step done
export function purchaseLegFlow(
  leg: Pick<PurchaseLeg, 'type' | 'approvalEnabled' | 'step' | 'status'>,
): PurchaseLegFlowStep[] {
  const steps: PurchaseLegStep[] = [
    ...(leg.approvalEnabled ? [PurchaseLegStepValues.APPROVAL] : []),
    ...purchaseTypeConfig[leg.type].steps,
    PurchaseLegStepValues.CLOSED,
  ];
  const currentIndex = leg.status === PurchaseLegStatusValues.CLOSED ? steps.length : steps.indexOf(leg.step);
  const isOpen = leg.status === PurchaseLegStatusValues.OPEN;
  return steps.map((step, index) => {
    if (currentIndex >= 0 && index < currentIndex) return { step, state: PurchaseFlowStepStateValues.DONE };
    if (isOpen && index === currentIndex) return { step, state: PurchaseFlowStepStateValues.CURRENT };
    return { step, state: PurchaseFlowStepStateValues.UPCOMING };
  });
}

// A plain step chain with nothing started, for a flow shown before any leg walks it
export function upcomingFlow(steps: PurchaseLegStep[]): PurchaseLegFlowStep[] {
  return steps.map((step) => ({ step, state: PurchaseFlowStepStateValues.UPCOMING }));
}

// Whether submitting a leg in sourcing sends it to approval: approval is enabled and there is no threshold, a line is
// unpriced, the total is in another currency than the threshold, or it reaches the threshold
export function legNeedsApproval(
  leg: Pick<PurchaseLeg, 'approvalEnabled' | 'approvalThreshold' | 'sourcedTotal' | 'hasUnpricedAllocations'>,
): boolean {
  if (!leg.approvalEnabled) return false;
  if (new Decimal(leg.approvalThreshold.value).isZero() || leg.hasUnpricedAllocations) return true;
  if (leg.sourcedTotal.currency !== leg.approvalThreshold.currency) return true;
  return new Decimal(leg.sourcedTotal.value).greaterThanOrEqualTo(leg.approvalThreshold.value);
}

// How much of an item's requested quantity its allocations cover, capped at 100
export function itemCoveragePercent({ primaryQty, allocatedPrimaryQty }: PurchaseSourcingItem): number {
  return primaryQty > 0 ? Math.min(100, (allocatedPrimaryQty / primaryQty) * 100) : 0;
}

// The suppliers with a posted quotation on the purchase
export function quotedSupplierIds(quotations: PurchaseQuotation[]): string[] {
  return uniq(quotations.filter((quotation) => quotation.isPosted).map((quotation) => quotation.supplierId));
}
