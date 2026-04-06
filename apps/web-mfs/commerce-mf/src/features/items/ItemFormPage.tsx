import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useItem } from '@/hooks/useItem';
import { EditItemForm } from './forms/EditItemForm';
import { InventoryRecipeTab } from './tabs/InventoryRecipeTab';
import { ModifiersTab } from './tabs/ModifiersTab';
import { OverviewTab } from './tabs/OverviewTab';
import { VariationsTab } from './tabs/VariationsTab';

export const ItemFormPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item, isLoading } = useItem(id ?? null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const editDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">Item not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        description={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
            <Badge
              variant="secondary"
              className={item.type === 'PRODUCT' ? 'bg-primary/10 text-primary' : 'bg-accent/50 text-accent-foreground'}
            >
              {item.type === 'PRODUCT' ? 'Product' : 'Service'}
            </Badge>
            <Badge
              variant={item.isAvailable ? 'secondary' : 'outline'}
              className={item.isAvailable ? 'bg-success/15 text-success' : ''}
            >
              {item.isAvailable ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        }
        actions={
          <Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
            Edit
          </Button>
        }
      />

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', content: <OverviewTab item={item} /> },
          { value: 'variations', label: 'Variations', content: <VariationsTab item={item} /> },
          { value: 'modifiers', label: 'Modifiers', content: <ModifiersTab item={item} /> },
          { value: 'inventory', label: 'Inventory Recipe', content: <InventoryRecipeTab /> },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={editDialog}
        title="Edit Item"
        description="Update the details for this item."
        content={(close) => <EditItemForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
