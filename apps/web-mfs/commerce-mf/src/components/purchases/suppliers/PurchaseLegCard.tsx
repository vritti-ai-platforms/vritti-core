import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import Decimal from '@vritti/quantum-ui/decimal';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import {
  type PurchaseHeader,
  type PurchaseLeg,
  PurchaseLegStatusValues,
  PurchaseLegStepValues,
  purchaseLegStepConfig,
  purchaseTypeConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';
import { PurchaseStepChips } from '../PurchaseStepChips';
import { legNeedsApproval, purchaseLegFlow, purchaseLegState } from '../purchaseState';
import { PurchaseLegActions } from './PurchaseLegActions';
import { PurchaseLegDocuments } from './PurchaseLegDocuments';
import { PurchaseLegFulfilmentActions } from './PurchaseLegFulfilmentActions';
import { PurchaseLegProgressBars } from './PurchaseLegProgressBars';

interface PurchaseLegCardProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
  preview?: boolean;
  readOnly: boolean;
}

// One supplier of the purchase: its flow and where it is on the flow's steps, who approves it and what it will order;
// a rejected supplier shows why it went back to sourcing, and once fulfilling how far it is received and invoiced, the
// documents its actions created and the actions its step offers
export const PurchaseLegCard: React.FC<PurchaseLegCardProps> = ({
  binding,
  purchase,
  leg,
  preview = false,
  readOnly,
}) => {
  const fmt = useFormatters();
  const flow = purchaseTypeConfig[leg.type];
  const isRejected = leg.step === PurchaseLegStepValues.SOURCING && leg.rejection !== null;
  const state = purchaseLegState(leg, isRejected);
  const isPastApproval =
    leg.status === PurchaseLegStatusValues.OPEN &&
    leg.step !== PurchaseLegStepValues.SOURCING &&
    leg.step !== PurchaseLegStepValues.APPROVAL;
  const { purchaseOrders, deliveries, receipts, invoices } = leg.documents;
  const hasDocuments = purchaseOrders.length + deliveries.length + receipts.length + invoices.length > 0;
  const showActions = !preview && !readOnly;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {leg.supplierName}
            <Badge variant={state.variant}>{state.label}</Badge>
          </CardTitle>
          <CardDescription>
            {[
              leg.submittedAt && `Submitted ${fmt.date(leg.submittedAt).primary}`,
              pluralize('item', leg.allocations.length, true),
              `${fmt.currency(leg.sourcedTotal).primary} sourced`,
              leg.hasUnpricedAllocations && 'some lines priced on the supplier invoice',
            ]
              .filter(Boolean)
              .join(' · ')}
          </CardDescription>
        </div>
        {showActions && (
          <div className="flex flex-wrap items-center gap-2">
            <PurchaseLegActions binding={binding} purchase={purchase} leg={leg} />
            <PurchaseLegFulfilmentActions binding={binding} purchase={purchase} leg={leg} />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Typography variant="body2">
            <span className="font-medium">{flow.label}</span>
            <span className="text-muted-foreground">{` · ${flow.description}`}</span>
          </Typography>
          <PurchaseStepChips steps={purchaseLegFlow(leg)} />
          {preview && leg.step === PurchaseLegStepValues.SOURCING && (
            <Typography variant="caption" intent="muted">
              {legNeedsApproval(leg)
                ? `On Submit: needs approval by ${leg.approverNames.join(', ')}`
                : `On Submit: goes straight to ${purchaseLegStepConfig[flow.steps[0]].label} — no approval`}
            </Typography>
          )}
        </div>
        {isRejected && leg.rejection && (
          <Alert
            variant="destructive"
            title={`Rejected by ${leg.rejection.actorName ?? 'an approver'} · ${fmt.dateTime(leg.rejection.at).primary}`}
            description={`“${leg.rejection.reason}”`}
          />
        )}
        {!preview && (isPastApproval || hasDocuments) && <PurchaseLegProgressBars progress={leg.progress} />}
        {!preview && hasDocuments && <PurchaseLegDocuments binding={binding} leg={leg} />}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <DetailField
            label="Approvers"
            type="string"
            value={leg.approvalEnabled ? `${leg.approverNames.join(', ')} — any one approves` : 'No approval needed'}
          />
          {new Decimal(leg.approvalThreshold.value).isZero() ? (
            <DetailField label="Approval Above" type="string" value="Every purchase" />
          ) : (
            <DetailField label="Approval Above" type="currency" value={leg.approvalThreshold} />
          )}
          <DetailField
            label="Approved"
            type="string"
            value={leg.approvedByName && `${leg.approvedByName} · ${fmt.dateTime(leg.approvedAt).primary}`}
          />
          <DetailField
            label="Will Order"
            type="string"
            className="sm:col-span-3"
            value={leg.allocations
              .map(
                (allocation) =>
                  `${allocation.inventoryItemName} — ${fmt.number(allocation.uomQty).primary} ${allocation.uomSymbol ?? ''}`,
              )
              .join(' · ')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
