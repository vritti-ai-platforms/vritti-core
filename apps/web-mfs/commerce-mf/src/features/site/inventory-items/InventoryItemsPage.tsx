import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, NumberCell, type RowAction } from '@vritti/quantum-ui/DataTable';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItemsTable } from '@/components/inventory-items/InventoryItemsTable';
import { INVENTORY_ITEMS_TABLE_KEY, useInventoryItemsTable } from '@/hooks/site/inventory-items';
import type { SiteInventoryItemData } from '@/schemas/inventory-items';
import { EnableInventoryItemDialog } from './forms/EnableInventoryItemDialog';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const { data: response, isLoading } = useInventoryItemsTable();

  const extraColumns = useMemo<ColumnDef<SiteInventoryItemData>[]>(
    () => [
      {
        accessorKey: 'isEnabled',
        header: 'At This Site',
        cell: ({ row }) =>
          row.original.isEnabled ? (
            <Badge variant="success">Enabled</Badge>
          ) : (
            <Badge variant="outline">Not enabled</Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'stockedQuantity',
        header: 'On Hand',
        cell: ({ row }) => (row.original.isEnabled ? <NumberCell value={row.original.stockedQuantity} /> : '—'),
        enableSorting: false,
      },
    ],
    [],
  );

  const rowActions = useCallback(
    (item: SiteInventoryItemData): RowAction[] => [
      {
        id: 'view',
        icon: Eye,
        label: 'View',
        hidden: !item.isEnabled,
        onClick: () => navigate(buildSlug(item.name, item.id)),
      },
      {
        id: 'enable',
        icon: PackageCheck,
        label: 'Enable at Site',
        permission: SITE_INVENTORY_ITEMS.enable,
        hidden: item.isEnabled,
        dialog: {
          title: `Enable "${item.name}"`,
          description: 'Start stocking this item at the site. Thresholds can be set now or later.',
          content: (close) => <EnableInventoryItemDialog item={item} onSuccess={close} onCancel={close} />,
        },
      },
    ],
    [navigate],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="The organization's items, and which of them this site stocks" />

      <InventoryItemsTable
        response={response}
        isLoading={isLoading}
        slug="commerce-site-inventory-items"
        tableKey={INVENTORY_ITEMS_TABLE_KEY}
        permission={SITE_INVENTORY_ITEMS.view}
        extraColumns={extraColumns}
        extraFilters={[
          <SelectFilter
            key="isEnabled"
            name="isEnabled"
            label="At This Site"
            options={[
              { label: 'Enabled', value: 'true' },
              { label: 'Not enabled', value: 'false' },
            ]}
          />,
        ]}
        rowActions={rowActions}
      />
    </div>
  );
};
