import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { lockedTip, PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Layers, Plus } from 'lucide-react';
import { useState } from 'react';
import { useUomDimensionCount } from '@/hooks/uom-dimensions';
import { UomDimensionDetailPanel } from './components/UomDimensionDetailPanel';
import { UomDimensionsPanel } from './components/UomDimensionsPanel';
import { AddUomDimensionDialog } from './forms/AddUomDimensionDialog';

export const UomPage = () => {
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);
  const addDimensionDialog = useDialog();
  const { data: dimensionCount } = useUomDimensionCount();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Units of Measure"
        description={pluralize('dimension', dimensionCount.count, true)}
        actions={
          <Button
            onClick={addDimensionDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission="uom.dim.add"
          >
            Add Dimension
          </Button>
        }
      />

      <PageContent>
        <PermissionGate
          permission="uom.dim.view"
          fallback={({ granted, reason, unlockPlans }) => (
            <PageContentPanel
              isEmpty
              emptyState={
                <Empty
                  icon={<PermissionLockIcon reason={reason} />}
                  title={granted ? 'Dimensions locked' : 'No access'}
                  description={
                    granted ? lockedTip({ reason, unlockPlans }) : 'You do not have access to view dimensions.'
                  }
                />
              }
            />
          )}
        >
          <UomDimensionsPanel selectedId={selectedDimensionId} onSelect={setSelectedDimensionId} />
        </PermissionGate>
        <UomDimensionDetailPanel dimensionId={selectedDimensionId} onDeleted={() => setSelectedDimensionId(null)} />
      </PageContent>

      <Dialog
        handle={addDimensionDialog}
        icon={Layers}
        title="Add Dimension"
        description="Create a new UOM dimension."
        content={(close) => <AddUomDimensionDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
