import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { filter } from '@vritti/quantum-ui/filter';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { sumBy } from '@vritti/quantum-ui/lodash';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SegmentedProgress, SegmentedProgressKey } from '@vritti/quantum-ui/SegmentedProgress';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import type { FilterCondition } from '@vritti/quantum-ui/types/conditions';
import { ArrowRight } from 'lucide-react';
import type React from 'react';
import {
  type PurchaseDetail,
  type PurchaseItemBucket,
  PurchaseItemBucketValues,
  type PurchaseLegCount,
  PurchaseLegStatusValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  PurchaseStatusValues,
  purchaseLegStepConfig,
} from '@/schemas/purchases';
import type { PurchaseDetailTable, PurchasesBinding } from '../bindings';
import { PurchaseDangerZone } from '../PurchaseDangerZone';
import { PURCHASE_PROGRESS, purchaseLegState, purchaseProgressCaption } from '../purchaseState';
import { usePurchaseTabLink } from './usePurchaseTabLink';

interface PurchaseOverviewTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

interface TabLinkEntry {
  key: string;
  label: string;
  count: number;
  table: PurchaseDetailTable;
  context: FilterCondition[];
}

type StandingEntry = TabLinkEntry & { lineCount: number };

const ITEM_ATTENTION: { bucket: PurchaseItemBucket; label: string }[] = [
  { bucket: PurchaseItemBucketValues.NEEDS_QUOTATIONS, label: 'Items short of quotations' },
  { bucket: PurchaseItemBucketValues.NOT_ALLOCATED, label: 'Items not allocated to a supplier' },
  { bucket: PurchaseItemBucketValues.ALLOCATED, label: 'Items allocated but not ordered' },
  { bucket: PurchaseItemBucketValues.IN_TRANSIT, label: 'Items on their way' },
  { bucket: PurchaseItemBucketValues.RECEIVED, label: 'Items received but not invoiced' },
];

// The open suppliers waiting at a step, counted
function openAt(counts: PurchaseLegCount[], step: PurchaseLegStep): number {
  return sumBy(
    counts.filter((count) => count.status === PurchaseLegStatusValues.OPEN && count.step === step),
    'count',
  );
}

// The suppliers table narrowed to the open suppliers at a step
function openAtStep(step: PurchaseLegStep): FilterCondition[] {
  return [filter('status').equals(PurchaseLegStatusValues.OPEN), filter('step').equals(step)];
}

// Where the suppliers stand: the open ones by step in flow order, then the closed and the cancelled
function supplierStanding(counts: PurchaseLegCount[]): StandingEntry[] {
  const open = counts
    .filter((count) => count.status === PurchaseLegStatusValues.OPEN)
    .map((count) => ({
      key: count.step,
      label: purchaseLegStepConfig[count.step].label,
      count: count.count,
      lineCount: count.lineCount,
      table: 'suppliers' as const,
      context: openAtStep(count.step),
    }));
  const ended = [PurchaseLegStatusValues.CLOSED, PurchaseLegStatusValues.CANCELLED].map((status) => {
    const atStatus = counts.filter((count) => count.status === status);
    return {
      key: status,
      label: purchaseLegState({ status, step: PurchaseLegStepValues.CLOSED }).label,
      count: sumBy(atStatus, 'count'),
      lineCount: sumBy(atStatus, 'lineCount'),
      table: 'suppliers' as const,
      context: [filter('status').equals(status)],
    };
  });
  return [...open, ...ended].filter((entry) => entry.count > 0);
}

// The purchase at a glance: its counts, how far its items have got, what needs someone's attention — each opening the
// tab narrowed to it — where its suppliers stand, and its destructive actions
export const PurchaseOverviewTab: React.FC<PurchaseOverviewTabProps> = ({ binding, purchase }) => {
  const fmt = useFormatters();
  const openTab = usePurchaseTabLink(binding, purchase.id);
  const { data: facets, isLoading: facetsLoading } = binding.usePurchaseItemFacets(purchase.id);
  const { data: legCounts = [], isLoading: countsLoading } = binding.usePurchaseSupplierCounts(purchase.id);
  const { data: counts } = binding.usePurchaseCounts(purchase.id);
  const { data: progress } = binding.usePurchaseProgress(purchase.id);
  const isOpen = purchase.status === PurchaseStatusValues.OPEN;

  const attention: TabLinkEntry[] = [
    ...ITEM_ATTENTION.map(({ bucket, label }) => ({
      key: bucket,
      label,
      count: facets?.[bucket] ?? 0,
      table: 'items' as const,
      context: [filter('bucket').equals(bucket)],
    })),
    {
      key: 'sourcing',
      label: 'Suppliers to submit',
      count: openAt(legCounts, PurchaseLegStepValues.SOURCING),
      table: 'suppliers' as const,
      context: openAtStep(PurchaseLegStepValues.SOURCING),
    },
    {
      key: 'approval',
      label: 'Suppliers awaiting approval',
      count: openAt(legCounts, PurchaseLegStepValues.APPROVAL),
      table: 'suppliers' as const,
      context: openAtStep(PurchaseLegStepValues.APPROVAL),
    },
  ].filter((entry) => entry.count > 0);
  const standing = supplierStanding(legCounts);

  const kpis = [
    { label: 'Items', value: counts && fmt.number(counts.itemCount).primary },
    { label: 'Suppliers', value: counts && fmt.number(counts.supplierCount).primary },
    { label: 'Quotations', value: counts && fmt.number(counts.quotationCount).primary },
    {
      label: 'Received',
      value: progress && fmt.percent(progress.segments.received + progress.segments.invoiced).primary,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex flex-col gap-1 py-4">
              <Typography variant="caption" intent="muted">
                {kpi.label}
              </Typography>
              {kpi.value === undefined ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <Typography variant="h4" className="font-mono">
                  {kpi.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          {progress ? (
            <CardDescription>{purchaseProgressCaption(progress, fmt)}</CardDescription>
          ) : (
            <Skeleton className="h-4 w-48" />
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {progress ? (
            <SegmentedProgress
              trackLabel={PURCHASE_PROGRESS.track.label}
              segments={PURCHASE_PROGRESS.segments.map(({ key, label }) => ({
                key,
                label,
                value: progress.segments[key],
              }))}
            />
          ) : (
            <Skeleton className="h-2 w-full rounded-full" />
          )}
          <SegmentedProgressKey items={PURCHASE_PROGRESS.segments} trackLabel={PURCHASE_PROGRESS.track.label} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>Opens the tab narrowed to what is waiting</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {facetsLoading || countsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : attention.length === 0 ? (
              <Typography variant="body2" intent="muted">
                {isOpen ? 'Nothing is waiting.' : 'The purchase is closed to changes.'}
              </Typography>
            ) : (
              attention.map((entry) => (
                <Button
                  key={entry.key}
                  variant="ghost"
                  className="justify-between"
                  endAdornment={<ArrowRight className="size-4" />}
                  onClick={() => openTab(entry.table, entry.context)}
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>{entry.label}</span>
                    <span className="font-mono">{fmt.number(entry.count).primary}</span>
                  </span>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Where each supplier stands</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {countsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : standing.length === 0 ? (
              <Typography variant="body2" intent="muted">
                A supplier joins the purchase with its first allocation.
              </Typography>
            ) : (
              standing.map((entry) => (
                <Button
                  key={entry.key}
                  variant="ghost"
                  className="justify-between"
                  endAdornment={<ArrowRight className="size-4" />}
                  onClick={() => openTab(entry.table, entry.context)}
                >
                  <span className="flex w-full items-center justify-between gap-4">
                    <span>{entry.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {`${fmt.number(entry.count).primary} · ${pluralize('line', entry.lineCount, true)}`}
                    </span>
                  </span>
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <PurchaseDangerZone binding={binding} purchase={purchase} />
    </div>
  );
};
