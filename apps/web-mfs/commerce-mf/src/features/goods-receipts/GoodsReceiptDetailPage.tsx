import { Badge } from '@vritti/quantum-ui/Badge';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useGoodsReceipt } from '@/hooks/useGoodsReceipt';
import { LineItemsTab } from './tabs/LineItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

export const GoodsReceiptDetailPage = () => {
  const { id } = useSlugParams('grSlug');
  const { data: receipt } = useGoodsReceipt(id);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={receipt.grNumber}
        titleSlot={<Badge variant="outline">{receipt.status}</Badge>}
        description={receipt.supplierName}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab receipt={receipt} />,
          },
          {
            value: 'items',
            label: `Line Items (${receipt.items.length})`,
            content: <LineItemsTab receipt={receipt} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
