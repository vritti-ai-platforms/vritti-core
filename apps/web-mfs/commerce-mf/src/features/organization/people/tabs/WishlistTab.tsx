import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateTimeCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Heart } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { usePersonWishlist } from '@/hooks/organization/people';
import type { PersonWishlistRow } from '@/schemas/person-shopper';

interface WishlistTabProps {
  partyId: string;
}

/**
 * What this person saved for later on a storefront.
 *
 * Read only, and that is the whole surface: a saved list is the shopper's own, so staff adding to
 * it would be putting words in their mouth. The basket next door is different — staff take orders
 * over the phone.
 */
export const WishlistTab: React.FC<WishlistTabProps> = ({ partyId }) => {
  const { data: rows, isLoading } = usePersonWishlist(partyId);

  const columns = useMemo<ColumnDef<PersonWishlistRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => <StringCell value={row.original.name} />,
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <CurrencyCell value={row.original.price} />,
      },
      {
        accessorKey: 'isAvailable',
        header: 'Status',
        // A wishlist outlives what it points at — that is rather the point of one — so a delisted
        // item stays on the list and says so rather than disappearing.
        cell: ({ row }) =>
          row.original.isAvailable ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Available
            </Badge>
          ) : (
            <Badge variant="outline">Unavailable</Badge>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Saved',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-org-person-${partyId}-wishlist`,
    label: 'saved item',
    // A plain array, like the basket — nothing here is server-paged or sorted.
    serverState: { result: rows ?? [], count: rows?.length ?? 0 },
    enableRowSelection: false,
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      permission={ORG_PEOPLE.wishlist.view}
      emptyStateConfig={{
        icon: Heart,
        title: 'Nothing saved',
        description: 'This person has not saved anything for later on the storefront.',
      }}
    />
  );
};
