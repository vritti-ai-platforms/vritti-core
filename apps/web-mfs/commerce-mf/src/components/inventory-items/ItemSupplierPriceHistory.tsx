import type { ChartEmptyState, ChartInstance } from '@vritti/quantum-ui/Chart';
import { ChartKey } from '@vritti/quantum-ui/Chart';
import { ContextBar } from '@vritti/quantum-ui/ContextBar';
import { DateRangeFilter } from '@vritti/quantum-ui/DateRangePicker';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { LineChart } from '@vritti/quantum-ui/LineChart';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { CurrencyFilter } from '@vritti/quantum-ui/selects/currency';
import type React from 'react';
import { PriceKeyDetail } from '@/components/suppliers/PriceKeyDetail';
import { InventoryItemMrpFilter } from '@/selectors/inventory-item-mrp';
import { SupplierFilter } from '@/selectors/supplier';
import { UomFilter } from '@/selectors/uom';
import type { ItemPriceHistorySelection } from '@/utils/supplierPrice';

export const MAX_CHARTED_SUPPLIERS = 8;

interface ItemSupplierPriceHistoryProps {
  inventoryItemId: string;
  chart: ChartInstance<ItemPriceHistorySelection>;
  siteFilter?: React.ReactNode;
  emptyState: ChartEmptyState;
  mrpPermission: string;
}

// An inventory item's price from up to eight suppliers at one site — a coloured step line each, in one currency and per
// one unit — under the context bar that picks what it shows, and a key below with each supplier's price in force
export const ItemSupplierPriceHistory: React.FC<ItemSupplierPriceHistoryProps> = ({
  inventoryItemId,
  chart,
  siteFilter,
  emptyState,
  mrpPermission,
}) => {
  const fmt = useFormatters();
  const { available: canSeeMrp } = usePermission(mrpPermission);
  const currency = chart.view?.currency ?? '';
  const drawnSupplierCount = new Set(chart.view?.series.map((line) => line.supplierId)).size;

  return (
    <div className="flex flex-col gap-4">
      <LineChart
        chart={chart}
        contextBar={
          <ContextBar state={chart.context} className="justify-end">
            {siteFilter}
            <CurrencyFilter name="currency" mode="context" clearable={false} selectFirst />
            <UomFilter name="uom" label="Unit" mode="context" params={{ inventoryItemId }} />
            <SupplierFilter
              name="supplierIds"
              label="Suppliers"
              placeholder="Preferred & latest"
              mode="context"
              multiple
              maxSelected={MAX_CHARTED_SUPPLIERS}
              inventoryItemId={inventoryItemId}
            />
            {canSeeMrp && (
              <InventoryItemMrpFilter name="mrpIds" mode="context" multiple inventoryItemId={inventoryItemId} />
            )}
            <DateRangeFilter name="period" label="Period" mode="context" />
          </ContextBar>
        }
        xAxisKey="at"
        xAxisType="time"
        curve="stepAfter"
        dot
        dashAlternate
        showLegend={false}
        emptyState={emptyState}
        valueFormatter={(value) => String(fmt.currency({ currency, value: String(value) }).primary)}
        xAxisFormatter={(value) => String(fmt.date(new Date(Number(value)).toISOString().slice(0, 10)).primary)}
        footnote={
          drawnSupplierCount >= MAX_CHARTED_SUPPLIERS &&
          `The chart compares up to ${MAX_CHARTED_SUPPLIERS} suppliers at a time. ${
            chart.context.contextValues('supplierIds').length === 0
              ? 'It starts with the preferred and most recently priced; change the suppliers to compare others.'
              : 'Remove one to add another.'
          }`
        }
      />
      <ChartKey
        chart={chart}
        title="Prices in Force"
        value={(line) => (line.current ? fmt.currency(line.current.unitPrice).primary : '—')}
        detail={(line) => <PriceKeyDetail price={line} />}
      />
    </div>
  );
};
