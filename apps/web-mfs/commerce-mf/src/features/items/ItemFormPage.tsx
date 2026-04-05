import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useItem } from '@/hooks/useItem';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { InventoryRecipeTab } from './tabs/InventoryRecipeTab';
import { ModifiersTab } from './tabs/ModifiersTab';
import { VariationsTab } from './tabs/VariationsTab';

const TAB_ORDER = ['basic', 'variations', 'modifiers', 'inventory'] as const;

export const ItemFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const tabs = [
    { value: 'basic', label: 'Basic Info', content: <BasicInfoTab item={item} onNext={goToNextTab} /> },
    { value: 'variations', label: 'Variations', content: <VariationsTab item={item} /> },
    { value: 'modifiers', label: 'Modifiers', content: <ModifiersTab item={item} /> },
    { value: 'inventory', label: 'Inventory Recipe', content: <InventoryRecipeTab /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{item.name}</h1>
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
          <span className="text-sm font-mono text-muted-foreground">{item.code}</span>
        </div>
      </div>

      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
    </div>
  );
};
