import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, CurrencyCell, DateCell, DateTimeCell, StringCell } from '@vritti/quantum-ui/DataTable';
import { PRICE_SOURCE_LABELS, type SupplierItemPriceRow } from '@/schemas/suppliers';

// The data columns of a supplier item's price table; `showSite` adds the site for a table spanning every site
export function supplierPriceColumns<T extends SupplierItemPriceRow = SupplierItemPriceRow>({
  showMrp,
  showSite,
}: {
  showMrp: boolean;
  showSite: boolean;
}): ColumnDef<T>[] {
  return [
    ...(showSite
      ? [
          {
            accessorKey: 'siteName',
            header: 'Site',
            enableSorting: false,
            cell: ({ row }: { row: { original: T } }) => (
              <StringCell value={row.original.siteName ?? row.original.siteCode ?? row.original.siteId} />
            ),
          } satisfies ColumnDef<T>,
        ]
      : []),
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
    },
    ...(showMrp
      ? [
          {
            accessorKey: 'mrp',
            header: 'MRP',
            enableSorting: false,
            cell: ({ row }: { row: { original: T } }) => <CurrencyCell value={row.original.mrp} />,
          } satisfies ColumnDef<T>,
        ]
      : []),
    {
      accessorKey: 'taxInclusive',
      header: 'Tax',
      enableSorting: false,
      cell: ({ row }) => <Badge variant="outline">{row.original.taxInclusive ? 'Inclusive' : 'Exclusive'}</Badge>,
    },
    {
      accessorKey: 'scheme',
      header: 'Scheme',
      enableSorting: false,
      cell: ({ row }) => {
        const { schemeBuyQty, schemeFreeQty } = row.original;
        return schemeBuyQty && schemeFreeQty ? (
          <span className="font-mono">
            {schemeBuyQty}+{schemeFreeQty}
          </span>
        ) : (
          'None'
        );
      },
    },
    {
      accessorKey: 'validFrom',
      header: 'Valid From',
      cell: ({ row }) => <DateCell value={row.original.validFrom} />,
    },
    {
      accessorKey: 'validTo',
      header: 'Valid To',
      cell: ({ row }) =>
        row.original.validTo ? <DateCell value={row.original.validTo} /> : <Badge variant="outline">Open-ended</Badge>,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <Badge variant="secondary">{PRICE_SOURCE_LABELS[row.original.source]}</Badge>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
    },
  ];
}
