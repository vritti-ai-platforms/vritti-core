import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useSupplier } from '@/hooks/useSupplier';
import { useUnlinkSupplierItem } from '@/hooks/useUnlinkSupplierItem';
import { AddSupplierItemDialog } from './forms/AddSupplierItemDialog';
import { EditSupplierForm } from './forms/EditSupplierForm';

export const SupplierDetailPage = () => {
  const { id } = useSlugParams('supplierSlug');
  const { data: supplier, isLoading } = useSupplier(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const addItemDialog = useDialog();
  const confirm = useConfirm();
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
            label: `Items (${supplier.items.length})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Linked Items</CardTitle>
                  <Button size="sm" onClick={addItemDialog.open}>
                    <Plus className="mr-2 size-4" />
                    Link Item
                  </Button>
                </CardHeader>
                <CardContent>
                  {supplier.items.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No items linked yet. Click "Link Item" to associate inventory items with this supplier.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">Inventory Item</th>
                            <th className="pb-2 font-medium">Supplier Code</th>
                            <th className="pb-2 font-medium">UOM</th>
                            <th className="pb-2 font-medium text-right">Unit Price</th>
                            <th className="pb-2 font-medium text-right">Min Order</th>
                            <th className="pb-2 font-medium text-center">Preferred</th>
                            <th className="pb-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplier.items.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-3 font-medium">{item.inventoryItemName ?? item.inventoryItemId}</td>
                              <td className="py-3 font-mono">{item.supplierCode ?? '—'}</td>
                              <td className="py-3">{item.uomSymbol ?? '—'}</td>
                              <td className="py-3 text-right font-mono">
                                {item.unitPrice != null ? item.unitPrice.toFixed(2) : '—'}
                              </td>
                              <td className="py-3 text-right font-mono">{item.minOrderQuantity ?? '—'}</td>
                              <td className="py-3 text-center">
                                {item.isPreferred ? (
                                  <Badge variant="secondary" className="bg-success/15 text-success">
                                    Yes
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleUnlinkItem(item.id, item.inventoryItemName ?? 'item')}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
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
        content={(close) => <AddSupplierItemDialog supplier={supplier} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
