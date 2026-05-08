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
import { useBom } from '@/hooks/bom';
import { useUpdateBom } from '@/hooks/bom';
import { AddBomLineDialog } from './forms/AddBomLineDialog';
import { EditBomForm } from './forms/EditBomForm';

export const BomDetailPage = () => {
  const { id } = useSlugParams('bomSlug');
  const { data: bom, isLoading } = useBom(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();
  const addLineDialog = useDialog();
  const confirm = useConfirm();
  const removeMutation = useUpdateBom();

  const handleRemoveLine = useCallback(
    async (inventoryItemId: string, itemName: string) => {
      if (!bom) return;
      const confirmed = await confirm({
        title: `Remove "${itemName}"?`,
        description: 'This component will be removed from the BOM.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) {
        removeMutation.mutate({
          id: bom.id,
          data: {
            lines: bom.lines
              .filter((l) => l.inventoryItemId !== inventoryItemId)
              .map((l) => ({ inventoryItemId: l.inventoryItemId, requiredQuantity: l.requiredQuantity })),
          },
        });
      }
    },
    [bom, confirm, removeMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!bom) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">BOM not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={bom.name}
        description={bom.code}
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
                      <p className="text-sm text-muted-foreground">Code</p>
                      <p className="mt-1 font-mono font-medium">{bom.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={bom.isActive ? 'secondary' : 'outline'}
                        className={bom.isActive ? 'mt-1 bg-success/15 text-success' : 'mt-1'}
                      >
                        {bom.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'lines',
            label: `Components (${bom.lines.length})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>BOM Lines</CardTitle>
                  <Button size="sm" onClick={addLineDialog.open}>
                    <Plus className="mr-2 size-4" />
                    Add Component
                  </Button>
                </CardHeader>
                <CardContent>
                  {bom.lines.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No components added yet. Click "Add Component" to get started.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Inventory Item</th>
                            <th className="pb-2 font-medium text-right">Required Quantity</th>
                            <th className="pb-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bom.lines.map((line, index) => (
                            <tr key={line.id} className="border-b last:border-0">
                              <td className="py-3 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 font-medium">{line.inventoryItemName ?? line.inventoryItemId}</td>
                              <td className="py-3 text-right font-mono">{line.requiredQuantity}</td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    handleRemoveLine(line.inventoryItemId, line.inventoryItemName ?? 'item')
                                  }
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
        title="Edit Bill of Materials"
        description="Update the BOM details."
        content={(close) => <EditBomForm bom={bom} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={addLineDialog}
        title="Add Component"
        description="Select an inventory item and specify the required quantity."
        content={(close) => <AddBomLineDialog bom={bom} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
