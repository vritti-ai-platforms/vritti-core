import { Badge } from '@vritti/quantum-ui/Badge';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useCallback, useState } from 'react';
import { useItem } from '@/hooks/useItem';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { InventoryRecipeTab } from './tabs/InventoryRecipeTab';
import { ModifiersTab } from './tabs/ModifiersTab';
import { VariationsTab } from './tabs/VariationsTab';

const TAB_ORDER = ['basic', 'variations', 'modifiers', 'inventory'] as const;

export const ItemFormPage = () => {
  const { id } = useSlugParams('itemSlug');
  const { data: item, isLoading } = useItem(id ?? null);
  const [activeTab, setActiveTab] = useState<string>('basic');

  const goToNextTab = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab as (typeof TAB_ORDER)[number]);
    if (currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    }
  }, [activeTab]);

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
      />

      <Tabs
        tabs={[
          { value: 'basic', label: 'Basic Info', content: <BasicInfoTab item={item} onNext={goToNextTab} /> },
          { value: 'variations', label: 'Variations', content: <VariationsTab item={item} /> },
          { value: 'modifiers', label: 'Modifiers', content: <ModifiersTab item={item} /> },
          { value: 'inventory', label: 'Inventory Recipe', content: <InventoryRecipeTab /> },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
