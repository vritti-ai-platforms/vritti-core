import { Empty } from '@vritti/quantum-ui/Empty';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { PriceCurrencyFilter } from '@/components/suppliers/PriceCurrencyFilter';
import { PriceRangePicker } from '@/components/suppliers/PriceRangePicker';
import { type PriceSeries, PriceSeriesChart } from '@/components/suppliers/PriceSeriesChart';
import type { InventoryItemPriceGraph, PriceGraphSelection } from '@/schemas/suppliers';
import { defaultPriceRange, inCurrency, priceCurrencies } from '@/utils/supplierPrice';

// A chart draws at most this many suppliers, one colour each from the categorical palette
export const MAX_CHARTED_SUPPLIERS = 8;

interface ItemSupplierPricesGraphProps {
  graph: InventoryItemPriceGraph | undefined;
  isLoading: boolean;
  // Saves a new selection; the graph shows whatever is saved
  onSelectionChange: (selection: PriceGraphSelection) => void;
  // Controls before the others, e.g. a site picker
  filters?: React.ReactNode;
  // Shown in place of the chart when no supplier has a price to chart
  emptyState: React.ReactNode;
  // Where the supplier and MRP pick lists live, at the graph's site; absent until there is a site
  optionsEndpointBase: string | undefined;
  // Who may see MRPs; the MRP filter is hidden from everyone else
  mrpPermission: string;
}

// An inventory item's price from up to eight suppliers at one site — a coloured step line each, all per the item's
// primary unit so a strip and a box of ten compare like for like. Every control reads and saves the graph's live state,
// so the supplier picker always names the suppliers drawn, the server's default pick included.
export const ItemSupplierPricesGraph: React.FC<ItemSupplierPricesGraphProps> = ({
  graph,
  isLoading,
  onSelectionChange,
  filters,
  emptyState,
  optionsEndpointBase,
  mrpPermission,
}) => {
  const { available: canSeeMrp } = usePermission(mrpPermission);
  const selection = useMemo<PriceGraphSelection>(
    () => graph?.selection ?? { siteId: null, ...defaultPriceRange(), supplierIds: [], mrpIds: [], currency: null },
    [graph],
  );
  const change = (next: Partial<PriceGraphSelection>) => onSelectionChange({ ...selection, ...next });

  const currencies = useMemo(() => priceCurrencies(graph?.suppliers ?? []), [graph]);
  const currency = selection.currency && currencies.includes(selection.currency) ? selection.currency : currencies[0];

  // Each drawn supplier's line in the chosen currency; a supplier that never quoted in it drops out
  const suppliers = useMemo<PriceSeries[]>(
    () =>
      (graph?.suppliers ?? [])
        .map((supplier) => (currency ? inCurrency(supplier, currency) : supplier))
        .filter((supplier) => supplier.windows.length > 0)
        .map((supplier, _, all) => ({
          ...supplier,
          id: supplier.supplierItemId,
          // A supplier quoting the item in several units draws a line per unit, named by the unit it quotes
          label:
            supplier.quotedUomSymbol &&
            all.some((other) => other !== supplier && other.supplierId === supplier.supplierId)
              ? `${supplier.supplierName} (${supplier.quotedUomSymbol})`
              : supplier.supplierName,
        })),
    [graph, currency],
  );
  // The suppliers drawn, which the picker shows whether they were picked or chosen by the server
  const drawnSupplierIds = useMemo(
    () => [...new Set((graph?.suppliers ?? []).map((supplier) => supplier.supplierId))],
    [graph],
  );
  const supplierCount = graph?.supplierCount ?? 0;
  const perUnit = graph?.uomSymbol ? ` per ${graph.uomSymbol}` : '';
  const range = { from: selection.from, to: selection.to };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {graph
            ? drawnSupplierIds.length < supplierCount
              ? `Showing ${drawnSupplierIds.length} of ${pluralize('supplier', supplierCount, true)}, prices${perUnit}`
              : `${pluralize('supplier', supplierCount, true)}, prices${perUnit}`
            : ''}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          <PriceCurrencyFilter
            currencies={currencies}
            value={currency}
            onChange={(next) => change({ currency: next })}
          />
          {optionsEndpointBase && supplierCount > 1 && (
            <div className="w-56">
              <Select
                multiple
                searchable
                placeholder="Suppliers"
                maxDisplayedItems={1}
                optionsEndpoint={`${optionsEndpointBase}/suppliers`}
                params={range}
                fieldKeys={{ valueKey: 'id', labelKey: 'displayName', descriptionKey: 'code' }}
                value={selection.supplierIds.length ? selection.supplierIds : drawnSupplierIds}
                onChange={(values: unknown) =>
                  change({
                    supplierIds: (Array.isArray(values) ? values.map(String) : []).slice(0, MAX_CHARTED_SUPPLIERS),
                  })
                }
              />
            </div>
          )}
          {optionsEndpointBase && canSeeMrp && (
            <div className="w-56">
              <Select
                multiple
                placeholder="Any MRP"
                maxDisplayedItems={1}
                optionsEndpoint={`${optionsEndpointBase}/mrps`}
                params={range}
                fieldKeys={{ valueKey: 'id' }}
                value={selection.mrpIds}
                onChange={(values: unknown) => change({ mrpIds: Array.isArray(values) ? values.map(String) : [] })}
              />
            </div>
          )}
          <PriceRangePicker value={range} onChange={(next) => change(next)} />
        </div>
      </div>

      {isLoading && !graph ? (
        <Skeleton className="h-96 w-full" />
      ) : supplierCount === 0 ? (
        emptyState
      ) : suppliers.length === 0 ? (
        <Empty
          icon={<LineChartIcon className="size-6" />}
          title="No prices in this currency"
          description="None of the suppliers drawn has prices in this currency at these MRPs. Change the supplier, MRP or currency filter."
        />
      ) : (
        <PriceSeriesChart series={suppliers} currencyCode={currency ?? ''} noun="supplier" range={range} />
      )}

      {supplierCount > MAX_CHARTED_SUPPLIERS && (
        <p className="text-xs text-muted-foreground">
          The chart compares up to {MAX_CHARTED_SUPPLIERS} suppliers at a time.{' '}
          {selection.supplierIds.length === 0
            ? 'It starts with the preferred and most recently priced; change the suppliers to compare others.'
            : 'Remove one to add another.'}
        </p>
      )}
    </div>
  );
};
