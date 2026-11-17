import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import Decimal from '@vritti/quantum-ui/decimal';
import type { Formatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import {
  PurchaseFlowStepStateValues,
  type PurchaseItemProgressSummary,
  type PurchaseItemSupplierProgress,
  type PurchaseLeg,
  type PurchaseLegFlowStep,
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  type PurchaseProgress,
  type PurchaseProgressSegments,
  purchaseLegStepConfig,
  purchaseTypeConfig,
} from '@/schemas/purchases';

export interface PurchaseBadgeState {
  label: string;
  variant: BadgeProps['variant'];
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

// The purchase's item count and how much of it is received
export function purchaseProgressCaption({ itemCount, segments }: PurchaseProgress, fmt: Formatters): string {
  return `${pluralize('item', itemCount, true)} · ${fmt.percent(segments.received + segments.invoiced).primary} received`;
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

// How much of a quantity another covers, capped at 100
export function coveragePercent(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
}

// How far a quantity has got as shares of a whole, each stage's share net of the stages ahead of it
export function progressSegments(
  quantities: Omit<PurchaseItemSupplierProgress, 'legId' | 'supplierId' | 'supplierName'>,
  whole: number,
): PurchaseProgressSegments {
  const share = (qty: number) => coveragePercent(qty, whole);
  const invoiced = share(quantities.invoiced);
  const received = Math.max(invoiced, share(quantities.received));
  const inTransit = Math.max(received, share(quantities.received + quantities.inTransit));
  const ordered = Math.max(inTransit, share(quantities.ordered));
  const allocated = Math.max(ordered, share(quantities.allocated));
  return {
    invoiced,
    received: received - invoiced,
    inTransit: inTransit - received,
    ordered: ordered - inTransit,
    allocated: allocated - ordered,
    unallocated: 100 - allocated,
  };
}

// How far one item has got as shares of its quantity
export function itemProgressSegments(item: PurchaseItemProgressSummary): PurchaseProgressSegments {
  return progressSegments(
    {
      allocated: item.allocatedPrimaryQty,
      ordered: item.orderedPrimaryQty,
      inTransit: item.inTransitPrimaryQty,
      received: item.receivedPrimaryQty,
      invoiced: item.invoicedPrimaryQty,
    },
    item.primaryQty,
  );
}
