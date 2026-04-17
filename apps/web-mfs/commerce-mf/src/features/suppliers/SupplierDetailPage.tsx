import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteSupplier } from '@/hooks/useDeleteSupplier';
import { SUPPLIER_ITEMS_TABLE_KEY, useSupplierItemsTable } from '@/hooks/useSupplierItemsTable';
import { useSupplier } from '@/hooks/useSupplier';
import { useUnlinkSupplierItem } from '@/hooks/useUnlinkSupplierItem';
import type { SupplierItemData } from '@/schemas/suppliers';
import { SupplierContactsContent } from './components/SupplierContactsContent';
import { SupplierContactsSidePanel } from './components/SupplierContactsSidePanel';
import { AddSupplierItemDialog } from './forms/AddSupplierItemDialog';
import { EditSupplierForm } from './forms/EditSupplierForm';

export const SupplierDetailPage = () => {
  const { id } = useSlugParams('supplierSlug');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: supplier, isLoading } = useSupplier(id ?? null);
  const { data: linkedItemsResponse, isLoading: isLoadingLinkedItems } = useSupplierItemsTable(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const editDialog = useDialog();
  const addItemDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteSupplier();
  const unlinkMutation = useUnlinkSupplierItem(id ?? '');

  const handleUnlinkItem = useCallback(
    async (itemId: string, itemName: string) => {
      const confirmed = await confirm({
        title: `Remove "${itemName}"?`,
        description: 'This item will be unlinked from the supplier.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) unlinkMutation.mutate(itemId);
    },
    [confirm, unlinkMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!supplier) return;
    const confirmed = await confirm({
      title: `Delete "${supplier.name}"?`,
      description: 'This supplier and all linked supplier items and contacts will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(supplier.id, { onSuccess: () => navigate('..') });
    }
  }, [supplier, confirm, deleteMutation, navigate]);

  const linkedItemColumns = useMemo<ColumnDef<SupplierItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => row.original.inventoryItemName ?? row.original.inventoryItemId,
      },
      {
        accessorKey: 'supplierCode',
        header: 'Supplier Code',
        cell: ({ row }) => row.original.supplierCode ?? '—',
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol || '—',
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => (row.original.unitPrice != null ? row.original.unitPrice.toFixed(2) : '—'),
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) => (row.original.minOrderQuantity != null ? row.original.minOrderQuantity : '—'),
      },
      {
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) =>
          row.original.isPreferred ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Yes
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
            disabledAll={unlinkMutation.isPending}
            actions={[
              {
                id: 'unlink',
                icon: Trash2,
                label: 'Unlink',
                variant: 'destructive',
                onClick: () => handleUnlinkItem(row.original.id, row.original.inventoryItemName ?? 'item'),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleUnlinkItem, unlinkMutation.isPending],
  );

  const { table: linkedItemsTable } = useDataTable({
    columns: linkedItemColumns,
    slug: `commerce-supplier-${id ?? ''}-items`,
    label: 'linked item',
    serverState: linkedItemsResponse,
    enableRowSelection: false,
    onStatePush: () => {
      if (!id) return;
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(id) });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!supplier) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Supplier not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.name}
        description={supplier.code}
        actions={
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="mt-1 font-medium">{supplier.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Code</p>
                      <p className="mt-1 font-mono font-medium">{supplier.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="mt-1">{supplier.contactName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="mt-1">{supplier.phone ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="mt-1">{supplier.email ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="mt-1">{supplier.address ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GSTIN</p>
                      <p className="mt-1 font-mono">{supplier.gstin ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="mt-1">{supplier.paymentTerms ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Time</p>
                      <p className="mt-1">{supplier.leadTimeDays != null ? `${supplier.leadTimeDays} days` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={supplier.isActive ? 'secondary' : 'outline'}
                        className={supplier.isActive ? 'mt-1 bg-success/15 text-success' : 'mt-1'}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="mt-1">{supplier.notes ?? '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'items',
            label: `Items (${linkedItemsResponse?.count ?? 0})`,
            content: (
              <DataTable
                table={linkedItemsTable}
                isLoading={isLoadingLinkedItems}
                toolbarActions={{
                  actions: (
                    <Button size="sm" onClick={addItemDialog.open}>
                      <Plus className="mr-2 size-4" />
                      Link Item
                    </Button>
                  ),
                }}
                emptyStateConfig={{
                  icon: ClipboardList,
                  title: 'No linked items',
                  description: 'Link an inventory item to start tracking supplier-specific terms and pricing.',
                }}
              />
            ),
          },
          {
            value: 'contacts',
            label: 'Contacts',
            content: (
              <PageContent>
                <SupplierContactsSidePanel
                  supplierId={supplier.id}
                  selectedContactId={selectedContactId}
                  onSelectContact={setSelectedContactId}
                />
                <PageContentDetails>
                  <SupplierContactsContent
                    supplierId={supplier.id}
                    selectedContactId={selectedContactId}
                    onSelectContact={setSelectedContactId}
                  />
                </PageContentDetails>
              </PageContent>
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        title="Edit Supplier"
        description="Update the supplier details."
        content={(close) => <EditSupplierForm supplier={supplier} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={addItemDialog}
        title="Link Inventory Item"
        description="Associate an inventory item with this supplier."
        content={(close) => <AddSupplierItemDialog supplierId={supplier.id} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this supplier"
        description="This action cannot be undone. The supplier and its linked supplier items and contacts will be permanently removed."
        buttonText="Delete Supplier"
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
};
