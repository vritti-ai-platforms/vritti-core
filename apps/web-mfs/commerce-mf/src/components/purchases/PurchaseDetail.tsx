import { Button } from '@vritti/quantum-ui/Button';
import { useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { ChevronRight } from 'lucide-react';
import type React from 'react';
import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PurchaseHeader, PurchaseStep } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { PurchaseStageViewSkeleton } from './PurchaseDetailSkeleton';
import { PurchaseHeaderActions } from './PurchaseHeaderActions';
import { PurchaseStageBadge } from './PurchaseStageBadge';
import { PurchaseStageBar } from './PurchaseStageBar';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { isStageReadOnly } from './purchaseState';
import { ProcuringView } from './views/procuring/ProcuringView';
import { QuotingView } from './views/quoting/QuotingView';
import { RequestingView } from './views/requesting/RequestingView';
import { SourcingView } from './views/sourcing/SourcingView';

interface PurchaseDetailProps {
  binding: PurchasesBinding;
}

interface StageViewProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

const STAGE_VIEWS: Record<PurchaseStep, React.FC<StageViewProps>> = {
  REQUESTING: RequestingView,
  QUOTING: QuotingView,
  SOURCING: SourcingView,
  PROCURING: ProcuringView,
};

// `…/purchases/<number~id>` — a purchase's header, its stages as navigation and the view of the stage looked at: the
// stage it is in by default, or the one it ended in once completed or cancelled; an earlier stage opens read-only
export const PurchaseDetail: React.FC<PurchaseDetailProps> = ({ binding }) => {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const { id } = useSlugParams('purchaseSlug');
  const { data: purchase } = binding.usePurchase(id);
  // The stage picked on the bar, dropped once the purchase moves on so the new stage opens
  const [selection, setSelection] = useState({ step: purchase.step, stage: purchase.step });
  const viewed = selection.step === purchase.step ? selection.stage : purchase.step;
  const StageView = STAGE_VIEWS[viewed];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={purchase.purchaseNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <PurchaseStageBadge purchase={purchase} />
            <PurchaseStatusBadge purchase={purchase} />
          </div>
        }
        description={[purchase.siteName, `Created ${fmt.date(purchase.createdAt).primary}`].filter(Boolean).join(' · ')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              permission={binding.permissions.view}
              endAdornment={<ChevronRight className="size-4" />}
              onClick={() => navigate('activity')}
            >
              Activity
            </Button>
            <PurchaseHeaderActions binding={binding} purchase={purchase} />
          </div>
        }
      />

      <PurchaseStageBar
        purchase={purchase}
        viewed={viewed}
        onView={(stage) => setSelection({ step: purchase.step, stage })}
      />

      <Suspense key={viewed} fallback={<PurchaseStageViewSkeleton />}>
        <StageView binding={binding} purchase={purchase} readOnly={isStageReadOnly(purchase, viewed)} />
      </Suspense>
    </div>
  );
};
