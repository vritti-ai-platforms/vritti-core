import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DATE_FILTER_TODAY, DateFilter } from '@vritti/quantum-ui/DateFilter';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Scale } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PriceTrendChip } from '@/components/suppliers/PriceTrendChip';
import { LE_INVENTORY_ITEM_PRICES_TABLE_KEY, useInventoryItemPricesTable } from '@/hooks/legal-entity/inventory-items';
import type { ItemSupplierPriceComparisonRow } from '@/schemas/suppliers';
import { SiteFilter } from '@/selectors/site';
import { workspaceBase } from '@/utils/workspace';

interface PricesTableTabProps {
  inventoryItemId: string;
  itemName: string;
  // The item's own unit; a price quoted in another unit also shows per this one
  uomSymbol: string | null;
}

const YES_NO = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

// Every supplier's standing for the item at one site on a date (today by default), cheapest per unit first: the price in
// force in its own unit, per the item's primary unit and after its free-goods scheme, and how it last moved
export const PricesTableTab: React.FC<PricesTableTabProps> = ({ inventoryItemId, itemName, uomSymbol }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fmt = useFormatters();
  // The site and day the table is about — set in its context bar, not saved; the server picks the default site
  const [site, setSite] = useState<string>();
  const [asOf, setAsOf] = useState<string>(DATE_FILTER_TODAY);
  const { data: response, isLoading } = useInventoryItemPricesTable(inventoryItemId, { site, asOf });
  const showMrp = usePermission(LE_INVENTORY_ITEMS.mrp.view).available;

  // A price per the unit the supplier quotes, and below it per the item's own unit when the two differ — as on a PO line
  const priceLines = useCallback(
    (price: CurrencyValue, quotedUomSymbol: string | null, perItemUnit: CurrencyValue | null) => (
      <>
        <span className="font-mono">
          {fmt.currency(price).primary}
          {quotedUomSymbol && <span className="text-muted-foreground"> / {quotedUomSymbol}</span>}
        </span>
        {perItemUnit && uomSymbol && quotedUomSymbol !== uomSymbol && (
          <span className="font-mono text-xs text-muted-foreground">
            {fmt.currency(perItemUnit).primary} / {uomSymbol}
          </span>
        )}
      </>
    ),
    [fmt, uomSymbol],
  );

  const columns = useMemo<ColumnDef<ItemSupplierPriceComparisonRow>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        size: 280,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{row.original.supplierName}</span>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate font-mono" title={row.original.supplierCode}>
                {row.original.supplierCode}
              </span>
              {row.original.isPreferred && (
                <Badge variant="success" className="shrink-0">
                  Preferred
                </Badge>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'currentPrice',
        header: 'Price in Force',
        size: 190,
        cell: ({ row }) => {
          const { currentPrice, pricePerPrimary, quotedUomSymbol, currentFrom } = row.original;
          if (!currentPrice) return <span className="text-muted-foreground">None in force</span>;
          return (
            <div className="flex flex-col gap-0.5">
              {priceLines(currentPrice, quotedUomSymbol, pricePerPrimary)}
              {currentFrom && (
                <span className="text-xs text-muted-foreground">since {fmt.date(currentFrom).primary}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'effectivePricePerPrimary',
        header: 'Effective',
        size: 190,
        cell: ({ row }) => {
          const { effectivePrice, effectivePricePerPrimary, quotedUomSymbol, schemeBuyQty, schemeFreeQty } =
            row.original;
          if (!effectivePrice) return '—';
          return (
            <div className="flex flex-col gap-0.5">
              {priceLines(effectivePrice, quotedUomSymbol, effectivePricePerPrimary)}
              <span className="text-xs text-muted-foreground">
                {schemeBuyQty != null && schemeFreeQty != null ? `after ${schemeBuyQty}+${schemeFreeQty}` : 'no scheme'}
              </span>
            </div>
          );
        },
      },
      ...(showMrp
        ? [
            {
              accessorKey: 'mrp',
              header: 'MRP',
              size: 120,
              enableSorting: false,
              cell: ({ row }: { row: { original: ItemSupplierPriceComparisonRow } }) => (
                <CurrencyCell value={row.original.mrp} />
              ),
            } satisfies ColumnDef<ItemSupplierPriceComparisonRow>,
          ]
        : []),
      {
        accessorKey: 'changePercent',
        header: 'Last Change',
        size: 150,
        cell: ({ row }) => {
          const percent = row.original.changePercent;
          if (percent == null) return '—';
          return (
            <PriceTrendChip
              trend={{ direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat', percent: Math.abs(percent) }}
            />
          );
        },
      },
      {
        accessorKey: 'priceCount',
        header: 'Prices',
        size: 90,
        cell: ({ row }) => <NumberCell value={row.original.priceCount} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View Supplier Item',
                permission: LE_SUPPLIERS.items.view,
                onClick: () =>
                  navigate(
                    `${workspaceBase(pathname)}/suppliers/${buildSlug(row.original.supplierName, row.original.supplierId)}/${buildSlug(itemName, row.original.supplierItemId)}/overview`,
                  ),
              },
            ]}
          />
        ),
      },
    ],
    [showMrp, fmt, priceLines, navigate, pathname, itemName],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-le-inventory-item-${inventoryItemId}-prices`,
    label: 'supplier',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: LE_INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={LE_INVENTORY_ITEMS.prices.view}
      searchConfig={{
        columns: [
          { id: 'supplierName', label: 'Supplier name' },
          { id: 'supplierCode', label: 'Supplier code' },
        ],
        searchAll: true,
      }}
      contextBar={
        <>
          <SiteFilter
            value={response?.siteId ?? undefined}
            onChange={(result) => {
              if (typeof result?.value === 'string') setSite(result.value);
            }}
            siteIds={response?.siteIds ?? []}
            mode="context"
          />
          <DateFilter
            name="asOf"
            label="As of"
            mode="context"
            value={{ field: 'asOf', operator: 'equals', value: asOf }}
            onChange={(condition) =>
              setAsOf(typeof condition?.value === 'string' ? condition.value : DATE_FILTER_TODAY)
            }
          />
        </>
      }
      filters={[
        <SelectFilter key="inForce" name="inForce" label="Price in Force" options={YES_NO} />,
        <SelectFilter key="isPreferred" name="isPreferred" label="Preferred" options={YES_NO} />,
        <SelectFilter key="hasScheme" name="hasScheme" label="Scheme" options={YES_NO} />,
      ]}
      emptyStateConfig={{
        icon: Scale,
        title: 'No supplier prices',
        description: 'No supplier has priced this item at the selected site. Pick another site in the Site filter.',
      }}
    />
  );
};
