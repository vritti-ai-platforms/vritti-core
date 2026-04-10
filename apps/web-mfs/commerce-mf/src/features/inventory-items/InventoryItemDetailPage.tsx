import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useInventoryItem } from '@/hooks/useInventoryItem';
import { EditInventoryItemForm } from './forms/EditInventoryItemForm';
import { LedgerTab } from './tabs/LedgerTab';
import { LevelsTab } from './tabs/LevelsTab';

export const InventoryItemDetailPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item, isLoading } = useInventoryItem(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const editDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Inventory item not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={item.code}
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
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant="outline" className="mt-1">
                        {item.type === 'MATERIAL' ? 'Material' : 'Product'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unit of Measure</p>
                      <p className="mt-1 font-medium">{item.uomSymbol ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requires Shipping</p>
                      <p className="mt-1 font-medium">{item.requiresShipping ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="mt-1">{item.description ?? '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'levels',
            label: 'Stock Levels',
            content: <LevelsTab levels={item.levels} uomSymbol={item.uomSymbol} />,
          },
          {
            value: 'ledger',
            label: 'Ledger',
            content: <LedgerTab ledger={item.ledger} uomSymbol={item.uomSymbol} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        title="Edit Inventory Item"
        description="Update the details for this inventory item."
        content={(close) => <EditInventoryItemForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
