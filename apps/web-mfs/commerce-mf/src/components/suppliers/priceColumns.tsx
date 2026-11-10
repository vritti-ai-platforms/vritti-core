import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, CurrencyCell, DateCell, DateTimeCell } from '@vritti/quantum-ui/DataTable';
import { PRICE_SOURCE_LABELS, type SupplierItemPriceRow } from '@/schemas/suppliers';

// The data columns of a supplier item's price table at one site: the site's own prices and the legal entity's it
// falls back to, each named by its owner
export function supplierPriceColumns({ showMrp }: { showMrp: boolean }): ColumnDef<SupplierItemPriceRow>[] {
  return [
    {
      accessorKey: 'ownerName',
      header: 'Owner',
      enableSorting: false,
      cell: ({ row }) => <Badge variant="secondary">{row.original.ownerName}</Badge>,
    },
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
            cell: ({ row }) => <CurrencyCell value={row.original.mrp} />,
          } satisfies ColumnDef<SupplierItemPriceRow>,
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
