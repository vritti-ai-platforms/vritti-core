import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { Boxes, ClipboardList, Clock, Eye, Plus, Star, Truck } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SUPPLIER_ITEMS_TABLE_KEY, useSupplierItemsTable } from '@/hooks/legal-entity/suppliers';
import type { SupplierItemData } from '@/schemas/suppliers';
import { SupplierSiteFilter } from '@/selectors/supplier-site';
import { AddSupplierItemDialog } from '../forms/AddSupplierItemDialog';
import { SetSupplierItemLeadTimeDialog } from '../forms/SetSupplierItemLeadTimeDialog';
import { SetSupplierItemMinOrderDialog } from '../forms/SetSupplierItemMinOrderDialog';
import { SetSupplierItemPreferredDialog } from '../forms/SetSupplierItemPreferredDialog';

interface ItemsTabProps {
  supplierId: string;
}

export const ItemsTab = ({ supplierId }: ItemsTabProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { detail: tab } = useParams();
  // A tab URL (…/<supplier>/items) has a segment to climb out of before a child path; the bare detail URL has none
  const fromTab = useCallback((target: string) => (tab ? `../${target}` : target), [tab]);
  const addItemDialog = useDialog();
  const setPreferredDialog = useDialog();
  const setMinOrderDialog = useDialog();
  const setLeadTimeDialog = useDialog();
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const { data: response, isLoading } = useSupplierItemsTable(supplierId);

  const linkedItemColumns = useMemo<ColumnDef<SupplierItemData>[]>(
    () => [
      getSelectionColumn<SupplierItemData>(),
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => <StringCell value={row.original.inventoryItemName} />,
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time',
        cell: ({ row }) => (row.original.leadTimeDays != null ? `${row.original.leadTimeDays} d` : '—'),
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) =>
          row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
      },
      {
        accessorKey: 'siteCount',
        header: 'Sites',
        enableSorting: false,
        cell: ({ row }) => <NumberCell value={row.original.siteCount} />,
      },
      {
        accessorKey: 'preferredSiteCount',
        header: 'Preferred',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.preferredSiteCount > 0 ? (
            <Badge variant="success">
              {row.original.preferredSiteCount === row.original.siteCount
                ? 'All sites'
                : `${row.original.preferredSiteCount} of ${pluralize('site', row.original.siteCount, true)}`}
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: LE_SUPPLIERS.items.view,
                onClick: () =>
                  navigate(fromTab(`${buildSlug(row.original.inventoryItemName, row.original.id)}/overview`), {
                    relative: 'path',
                  }),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [fromTab, navigate],
  );

  const { table: linkedItemsTable } = useDataTable({
    columns: linkedItemColumns,
    slug: `commerce-supplier-${supplierId}-items`,
    label: 'item',
    serverState: response,
    enableRowSelection: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) }),
  });

  return (
    <>
      <DataTable
        table={linkedItemsTable}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.items.view}
        searchConfig={{
          columns: [
            { id: 'inventoryItemName', label: 'Item name' },
            { id: 'supplierItemCode', label: 'Supplier item code' },
            { id: 'uomSymbol', label: 'UOM' },
          ],
          searchAll: true,
        }}
        filters={[
          <SupplierSiteFilter key="sites" supplierId={supplierId} />,
          <ValueFilter key="leadTimeDays" name="leadTimeDays" label="Lead Time (days)" fieldType="number" />,
          <ValueFilter key="minOrderQuantity" name="minOrderQuantity" label="Min Order" fieldType="number" />,
          <SelectFilter
            key="isPreferred"
            name="isPreferred"
            label="Preferred"
            options={[
              { label: 'Preferred at a site', value: 'true' },
              { label: 'Not preferred anywhere', value: 'false' },
            ]}
          />,
        ]}
        selectActions={(rows) => (
          <>
            <Button
              size="sm"
              variant="outline"
              permission={LE_SUPPLIERS.sites.items.edit}
              startAdornment={<Star className="size-4" />}
              onClick={() => {
                setTargetIds(rows.map((r) => r.original.id));
                setPreferredDialog.open();
              }}
            >
              Set Preferred
            </Button>
            <Button
              size="sm"
              variant="outline"
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Boxes className="size-4" />}
              onClick={() => {
                setTargetIds(rows.map((r) => r.original.id));
                setMinOrderDialog.open();
              }}
            >
              Set Min Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Clock className="size-4" />}
              onClick={() => {
                setTargetIds(rows.map((r) => r.original.id));
                setLeadTimeDialog.open();
              }}
            >
              Set Lead Time
            </Button>
          </>
        )}
        toolbarActions={{
          actions: (
            <Button size="sm" permission={LE_SUPPLIERS.items.add} onClick={addItemDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No linked items',
          description: 'Link an inventory item and choose the sites that buy it from this supplier.',
        }}
      />

      <Dialog
        handle={addItemDialog}
        className="max-w-3xl"
        icon={Truck}
        title="Add Supplier Item"
        description="Link an inventory item to this supplier and set it up at its enrolled sites."
        content={(close) => <AddSupplierItemDialog supplierId={supplierId} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={setPreferredDialog}
        icon={Star}
        title="Set Preferred Supplier"
        description="Choose the sites where this supplier is preferred for the selected items."
        content={(close) => (
          <SetSupplierItemPreferredDialog
            supplierId={supplierId}
            supplierItemIds={targetIds}
            onSuccess={() => {
              close();
              linkedItemsTable.resetRowSelection();
            }}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={setMinOrderDialog}
        icon={Boxes}
        title="Set Minimum Order"
        description={`Set the least the supplier sells per order for ${pluralize('selected item', targetIds.length, true)}.`}
        content={(close) => (
          <SetSupplierItemMinOrderDialog
            supplierId={supplierId}
            supplierItemIds={targetIds}
            onSuccess={() => {
              close();
              linkedItemsTable.resetRowSelection();
            }}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={setLeadTimeDialog}
        icon={Clock}
        title="Set Lead Time"
        description={`Set the lead time for ${pluralize('selected item', targetIds.length, true)}; sites with their own lead time keep it.`}
        content={(close) => (
          <SetSupplierItemLeadTimeDialog
            supplierId={supplierId}
            supplierItemIds={targetIds}
            onSuccess={() => {
              close();
              linkedItemsTable.resetRowSelection();
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
