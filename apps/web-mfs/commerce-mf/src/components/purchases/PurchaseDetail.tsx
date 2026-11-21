import { useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import type React from 'react';
import type { PurchasesBinding } from './bindings';
import { PurchaseDetailActions } from './PurchaseDetailActions';
import { PurchaseDetailTabs } from './PurchaseDetailTabs';
import { PurchaseProgressBadge } from './PurchaseProgressBadge';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';

interface PurchaseDetailProps {
  binding: PurchasesBinding;
}

// `…/purchases/<number~id>/<tab>` — a purchase's header with its progress, status and actions, then its tabs
export const PurchaseDetail: React.FC<PurchaseDetailProps> = ({ binding }) => {
  const fmt = useFormatters();
  const { id } = useSlugParams('purchaseSlug');
  const { data: purchase } = binding.usePurchase(id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={purchase.purchaseNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <PurchaseProgressBadge binding={binding} purchaseId={purchase.id} />
            <PurchaseStatusBadge
              purchase={purchase}
              tip={purchase.cancelReason && `Cancelled: “${purchase.cancelReason}”`}
            />
          </div>
        }
        description={[purchase.siteName, `Created ${fmt.date(purchase.createdAt).primary}`].filter(Boolean).join(' · ')}
        actions={<PurchaseDetailActions binding={binding} purchase={purchase} />}
      />

      <PurchaseDetailTabs binding={binding} purchase={purchase} />
    </div>
  );
};
