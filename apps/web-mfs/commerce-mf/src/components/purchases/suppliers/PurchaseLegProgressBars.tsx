import { useFormatters } from '@vritti/quantum-ui/hooks';
import type { PurchaseLegProgress } from '@/schemas/purchases';
import { PurchaseCoverage } from '../PurchaseCoverage';

// A share of the leg's due quantity, capped at 100
function percentOfDue(qty: number, due: number): number {
  return due > 0 ? Math.min(100, (qty / due) * 100) : 0;
}

// How much of what the leg is due has been received, and how much invoiced, in the items' primary units
export const PurchaseLegProgressBars = ({ progress }: { progress: PurchaseLegProgress }) => {
  const fmt = useFormatters();
  const due = fmt.number(progress.duePrimaryQty).primary;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PurchaseCoverage
        percent={percentOfDue(progress.receivedPrimaryQty, progress.duePrimaryQty)}
        caption={`${fmt.number(progress.receivedPrimaryQty).primary} of ${due} received`}
      />
      <PurchaseCoverage
        percent={percentOfDue(progress.invoicedPrimaryQty, progress.duePrimaryQty)}
        caption={`${fmt.number(progress.invoicedPrimaryQty).primary} of ${due} invoiced`}
      />
    </div>
  );
};
