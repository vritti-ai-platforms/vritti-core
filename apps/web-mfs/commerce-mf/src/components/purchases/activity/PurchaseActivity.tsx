import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { type Formatters, useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Select, type SelectValue } from '@vritti/quantum-ui/Select';
import { Toggle } from '@vritti/quantum-ui/Toggle';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ChevronLeft, History } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PURCHASE_EVENT_DOCUMENT_LABELS,
  PURCHASE_EVENT_KIND_LABELS,
  type PurchaseEvent,
  PurchaseEventKindValues,
  type PurchaseLeg,
  type PurchaseQuotation,
} from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { goodsReceiptPath, inboundDeliveryPath, purchaseInvoicePath, purchaseOrderPath } from '../documentPaths';
import { PurchaseStageBadge } from '../PurchaseStageBadge';
import { PurchaseStatusBadge } from '../PurchaseStatusBadge';
import { type PurchaseActivityDocument, PurchaseActivityEvent } from './PurchaseActivityEvent';
import { PurchaseActivityTimelineSkeleton } from './PurchaseActivitySkeleton';

interface PurchaseActivityProps {
  binding: PurchasesBinding;
}

interface ActivityDay {
  label: string;
  events: PurchaseEvent[];
}

const KIND_PARAM = 'kind';
const SUPPLIER_PARAM = 'supplier';

// The purchase's documents by id, each with its number and the page it opens on: the suppliers' orders, deliveries,
// receipts and invoices, and its quotations where the workspace opens them
function documentsById(
  legs: PurchaseLeg[],
  quotations: PurchaseQuotation[],
  workspace: string,
  binding: PurchasesBinding,
): Map<string, PurchaseActivityDocument> {
  const documents = new Map<string, PurchaseActivityDocument>();
  for (const leg of legs) {
    const { purchaseOrders, deliveries, receipts, invoices } = leg.documents;
    for (const order of purchaseOrders) {
      documents.set(order.id, { label: order.poNumber, to: purchaseOrderPath(workspace, order) });
    }
    for (const delivery of deliveries) {
      documents.set(delivery.id, { label: delivery.deliveryNumber, to: inboundDeliveryPath(workspace, delivery) });
    }
    for (const receipt of receipts) {
      documents.set(receipt.id, { label: receipt.grNumber, to: goodsReceiptPath(workspace, receipt) });
    }
    for (const invoice of invoices) {
      documents.set(invoice.id, {
        label: invoice.invoiceNumber,
        to: purchaseInvoicePath(workspace, binding.invoicePath, invoice, leg),
      });
    }
  }
  for (const quotation of quotations) {
    const path = binding.quotations.quotationPath?.({
      supplierId: quotation.supplierId,
      supplierName: quotation.supplierName,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
    });
    documents.set(quotation.id, { label: quotation.quotationNumber, to: path && `${workspace}/${path}` });
  }
  return documents;
}

// The events grouped by the day they happened on, newest first as they arrive
function groupByDay(events: PurchaseEvent[], fmt: Formatters): ActivityDay[] {
  const days: ActivityDay[] = [];
  for (const event of events) {
    const label = String(fmt.date(event.createdAt).primary);
    const day = days[days.length - 1];
    if (day?.label === label) day.events.push(event);
    else days.push({ label, events: [event] });
  }
  return days;
}

// `…/purchases/<number~id>/activity` — everything that happened on a purchase, newest first and grouped by day, narrowed
// to a kind of event or one supplier through the URL so a filtered view can be linked; older events load on demand
export const PurchaseActivity: React.FC<PurchaseActivityProps> = ({ binding }) => {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useSlugParams('purchaseSlug');
  const { data: purchase } = binding.usePurchase(id);
  const { data: legs } = binding.usePurchaseSuppliers(id);
  const { data: quotations } = binding.usePurchaseQuotations(id);
  const kind = Object.values(PurchaseEventKindValues).find((value) => value === searchParams.get(KIND_PARAM));
  const purchaseSupplierId = legs.find((leg) => leg.id === searchParams.get(SUPPLIER_PARAM))?.id;
  const eventsQuery = binding.usePurchaseEvents(id, { kind, purchaseSupplierId });

  const workspace = workspaceBase(pathname);
  const documents = useMemo(
    () => documentsById(legs, quotations, workspace, binding),
    [legs, quotations, workspace, binding],
  );
  const days = useMemo(
    () => groupByDay(eventsQuery.data?.pages.flatMap((page) => page.result) ?? [], fmt),
    [eventsQuery.data, fmt],
  );

  // Writes a filter into the URL, or drops it when cleared
  const setFilter = (param: string, value: string | undefined) =>
    setSearchParams(
      (params) => {
        if (value) params.set(param, value);
        else params.delete(param);
        return params;
      },
      { replace: true },
    );

  // A document link for an event, by the document the event names; one no longer on the purchase shows its kind only
  const documentOf = (event: PurchaseEvent): PurchaseActivityDocument | undefined => {
    if (!event.documentType || !event.documentId) return undefined;
    return documents.get(event.documentId) ?? { label: PURCHASE_EVENT_DOCUMENT_LABELS[event.documentType] };
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activity"
        titleSlot={
          <div className="flex items-center gap-2">
            <PurchaseStageBadge purchase={purchase} />
            <PurchaseStatusBadge purchase={purchase} />
          </div>
        }
        description={`Everything that happened on ${purchase.purchaseNumber}, newest first`}
        actions={
          <Button
            size="sm"
            variant="outline"
            startAdornment={<ChevronLeft className="size-4" />}
            onClick={() => navigate('..', { relative: 'path' })}
          >
            Back to Purchase
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Toggle size="sm" variant="outline" pressed={!kind} onPressedChange={() => setFilter(KIND_PARAM, undefined)}>
          All
        </Toggle>
        {Object.values(PurchaseEventKindValues).map((value) => (
          <Toggle
            key={value}
            size="sm"
            variant="outline"
            pressed={kind === value}
            onPressedChange={(pressed) => setFilter(KIND_PARAM, pressed ? value : undefined)}
          >
            {PURCHASE_EVENT_KIND_LABELS[value]}
          </Toggle>
        ))}
        <div className="ml-auto w-64">
          <Select
            placeholder="All suppliers"
            clearable
            options={legs.map((leg) => ({ value: leg.id, label: leg.supplierName }))}
            value={purchaseSupplierId ?? null}
            onChange={(value: SelectValue) => setFilter(SUPPLIER_PARAM, value ? String(value) : undefined)}
            disabled={legs.length === 0}
          />
        </div>
      </div>

      {eventsQuery.isLoading && <PurchaseActivityTimelineSkeleton />}
      {eventsQuery.isError && (
        <Alert
          variant="destructive"
          title="Activity could not be loaded"
          description="Refresh the page to try again."
        />
      )}
      {eventsQuery.isSuccess && days.length === 0 && (
        <Empty
          icon={<History />}
          title="No activity"
          description={kind || purchaseSupplierId ? 'No activity matches these filters.' : 'Nothing has happened yet.'}
        />
      )}
      {days.map((day) => (
        <div key={day.label} className="flex flex-col gap-2">
          <Typography variant="caption" intent="muted" className="font-medium uppercase">
            {day.label}
          </Typography>
          <Card>
            <CardContent>
              <ol className="flex flex-col gap-1">
                {day.events.map((event) => (
                  <PurchaseActivityEvent key={event.id} event={event} document={documentOf(event)} />
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      ))}
      {eventsQuery.hasNextPage && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => eventsQuery.fetchNextPage()}
            isLoading={eventsQuery.isFetchingNextPage}
          >
            Load Older
          </Button>
        </div>
      )}
    </div>
  );
};
