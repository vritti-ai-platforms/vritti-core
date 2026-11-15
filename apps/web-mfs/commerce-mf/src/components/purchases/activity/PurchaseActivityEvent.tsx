import { Badge } from '@vritti/quantum-ui/Badge';
import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { mapValues } from '@vritti/quantum-ui/lodash';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight, Check, Dot, X } from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router-dom';
import {
  PURCHASE_EVENT_KIND_ACTIONS,
  PURCHASE_EVENT_LABELS,
  type PurchaseEvent,
  type PurchaseEventAction,
  PurchaseEventActionValues,
  type PurchaseLegStep,
  type PurchaseStep,
  purchaseLegStepConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';

export interface PurchaseActivityDocument {
  label: string;
  to?: string;
}

interface PurchaseActivityEventProps {
  event: PurchaseEvent;
  document?: PurchaseActivityDocument;
}

const STEP_LABELS: Record<PurchaseStep | PurchaseLegStep, string> = {
  ...mapValues(purchaseLegStepConfig, (config) => config.label),
  ...mapValues(purchaseStepConfig, (config) => config.label),
};

const NEGATIVE_ACTIONS: PurchaseEventAction[] = [
  PurchaseEventActionValues.REJECT,
  PurchaseEventActionValues.CANCEL,
  PurchaseEventActionValues.CANCEL_SUPPLIER_INVOICE,
  PurchaseEventActionValues.DISCARD_RECEIVE_WITH_INVOICE,
];
const POSITIVE_ACTIONS: PurchaseEventAction[] = [
  PurchaseEventActionValues.APPROVE,
  PurchaseEventActionValues.POST_GOODS_RECEIPT,
  PurchaseEventActionValues.POST_SUPPLIER_INVOICE,
  PurchaseEventActionValues.POST_RECEIVE_WITH_INVOICE,
  PurchaseEventActionValues.COMPLETE,
];

// The marker of an action: an arrow for a stage change, a cross for a rejection, cancellation or discard, a tick for an
// approval or a posted document, otherwise a dot
const EventMarker = ({ action, isStageChange }: { action: PurchaseEventAction; isStageChange: boolean }) => {
  const isNegative = NEGATIVE_ACTIONS.includes(action);
  const isPositive = POSITIVE_ACTIONS.includes(action);
  return (
    <span
      className={cn(
        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
        isNegative && 'bg-destructive/15 text-destructive',
        !isNegative && isStageChange && 'bg-primary/15 text-primary',
        !isNegative && !isStageChange && isPositive && 'bg-success/15 text-success',
        !isNegative && !isStageChange && !isPositive && 'bg-muted text-muted-foreground',
      )}
    >
      {isNegative && <X className="size-4" />}
      {!isNegative && isStageChange && <ArrowRight className="size-4" />}
      {!isNegative && !isStageChange && isPositive && <Check className="size-4" />}
      {!isNegative && !isStageChange && !isPositive && <Dot className="size-4" />}
    </span>
  );
};

// One action on the purchase: what happened, a stage change highlighted with where it moved from and to, the supplier
// and document it concerns, the reason given quoted, and who did it when
export const PurchaseActivityEvent: React.FC<PurchaseActivityEventProps> = ({ event, document }) => {
  const fmt = useFormatters();
  const isStageChange = PURCHASE_EVENT_KIND_ACTIONS.STAGE.includes(event.action);
  const stepChange =
    event.stepBefore && event.stepAfter && event.stepBefore !== event.stepAfter
      ? { from: STEP_LABELS[event.stepBefore], to: STEP_LABELS[event.stepAfter] }
      : null;

  return (
    <li className={cn('flex gap-3 rounded-lg p-3', isStageChange && 'border border-primary/30 bg-primary/5')}>
      <EventMarker action={event.action} isStageChange={isStageChange} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <Typography variant="body2" className="font-medium">
              {PURCHASE_EVENT_LABELS[event.action]}
            </Typography>
            {stepChange && (
              <span className="flex items-center gap-1.5">
                <Badge variant="outline">{stepChange.from}</Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="outline">{stepChange.to}</Badge>
              </span>
            )}
          </span>
          <Typography variant="caption" intent="muted">
            {fmt.dateTime(event.createdAt).primary}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {event.supplierName && <Badge variant="secondary">{event.supplierName}</Badge>}
          {document &&
            (document.to ? (
              <Badge variant="outline" asChild>
                <Link to={document.to}>{document.label}</Link>
              </Badge>
            ) : (
              <Badge variant="outline">{document.label}</Badge>
            ))}
          {event.actorName && (
            <Typography variant="caption" intent="muted">
              {`by ${event.actorName}`}
            </Typography>
          )}
        </div>
        {event.reason && (
          <Typography variant="body2" className="border-l-2 border-border pl-3 italic">
            {`“${event.reason}”`}
          </Typography>
        )}
      </div>
    </li>
  );
};
