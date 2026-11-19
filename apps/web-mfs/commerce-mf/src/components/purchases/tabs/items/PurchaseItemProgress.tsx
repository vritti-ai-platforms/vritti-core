import { useFormatters } from '@vritti/quantum-ui/hooks';
import { SegmentedProgress } from '@vritti/quantum-ui/SegmentedProgress';
import { Tooltip } from '@vritti/quantum-ui/Tooltip';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { Fragment } from 'react';
import type { PurchaseItemProgressSummary } from '@/schemas/purchases';
import { itemProgressSegments, PURCHASE_PROGRESS, progressSegments } from '../../purchaseState';

interface PurchaseItemProgressProps {
  item: PurchaseItemProgressSummary & { primaryUomSymbol: string };
  // Split the bar into one piece per supplier, sized by its allocation, with its own stages inside
  bySupplier: boolean;
}

interface Piece {
  key: string;
  label: string;
  tip: string;
  weight: number;
  bar: React.ReactNode;
}

// The divider between two suppliers' pieces, taller than the bar so it reads as a boundary, not a stage gap
const Divider = ({ hidden = false }: { hidden?: boolean }) => (
  <span aria-hidden className={`mx-1 h-3.5 w-px shrink-0 ${hidden ? 'invisible' : 'bg-muted-foreground'}`} />
);

// An item's quantity and how far it has got: one bar of its stages, or one piece per supplier — sized by what it was
// allocated, separated by a line, coloured by its own stages — with the part not yet allocated as the track
export const PurchaseItemProgress: React.FC<PurchaseItemProgressProps> = ({ item, bySupplier }) => {
  const fmt = useFormatters();
  const unit = item.primaryUomSymbol;
  const quantity = (value: number) => `${fmt.number(value).primary} ${unit}`.trim();
  const unallocated = Math.max(0, item.primaryQty - item.allocatedPrimaryQty);

  const pieces: Piece[] = [
    ...item.suppliers.map((supplier) => {
      const segments = progressSegments(supplier, supplier.allocated);
      return {
        key: supplier.legId,
        label: `${supplier.supplierName} · ${fmt.quantity(supplier.display.allocated).primary}`,
        tip: `${supplier.supplierName}: ${fmt.quantity(supplier.display.allocated).primary} allocated · ${fmt.quantity(supplier.display.ordered).primary} ordered · ${fmt.quantity(supplier.display.received).primary} received · ${fmt.quantity(supplier.display.invoiced).primary} invoiced`,
        weight: supplier.allocated,
        bar: (
          <SegmentedProgress
            aria-label={`${supplier.supplierName}: ${fmt.quantity(supplier.display.allocated).primary}`}
            segments={PURCHASE_PROGRESS.segments.map(({ key, label }) => ({
              key,
              label: `${supplier.supplierName} · ${label}`,
              value: segments[key],
            }))}
          />
        ),
      };
    }),
    ...(unallocated > 0
      ? [
          {
            key: 'unallocated',
            label: `${PURCHASE_PROGRESS.track.label} · ${fmt.number(unallocated).primary}`,
            tip: `${PURCHASE_PROGRESS.track.label}: ${quantity(unallocated)}`,
            weight: unallocated,
            bar: (
              <Tooltip content={`${PURCHASE_PROGRESS.track.label} · ${quantity(unallocated)}`}>
                <span className="block h-2 w-full rounded-full bg-progress-track" />
              </Tooltip>
            ),
          },
        ]
      : []),
  ];
  const combined = itemProgressSegments(item);

  return (
    <div className="flex min-w-48 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Tooltip content={fmt.quantity(item.display.primaryQty).secondary}>
          <Typography variant="body2" className="font-mono">
            {fmt.quantity(item.display.primaryQty).primary}
          </Typography>
        </Tooltip>
        <Typography variant="caption" intent="muted">
          {`${fmt.quantity(item.display.receivedPrimaryQty).primary} received`}
        </Typography>
      </div>
      {bySupplier ? (
        <>
          <div className="flex w-full items-center">
            {pieces.map((piece, index) => (
              <Fragment key={piece.key}>
                {index > 0 && <Divider />}
                <div className="min-w-1" style={{ flex: `${piece.weight} 1 0%` }}>
                  {piece.bar}
                </div>
              </Fragment>
            ))}
          </div>
          <div className="flex w-full items-start">
            {pieces.map((piece, index) => (
              <Fragment key={piece.key}>
                {index > 0 && <Divider hidden />}
                <div className="min-w-1" style={{ flex: `${piece.weight} 1 0%` }}>
                  <Tooltip content={piece.tip}>
                    <Typography variant="caption" intent="muted" className="block truncate">
                      {piece.label}
                    </Typography>
                  </Tooltip>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      ) : (
        <>
          <SegmentedProgress
            trackLabel={PURCHASE_PROGRESS.track.label}
            segments={PURCHASE_PROGRESS.segments.map(({ key, label }) => ({ key, label, value: combined[key] }))}
          />
          <Typography variant="caption" intent="muted" className="truncate">
            {item.suppliers.map((supplier) => supplier.supplierName).join(', ') || 'No supplier yet'}
          </Typography>
        </>
      )}
    </div>
  );
};
