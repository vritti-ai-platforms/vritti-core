import { UOM } from '@vritti/commerce-permissions/uom';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
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
        description={dimensionCount ? pluralize('dimension', dimensionCount.count, true) : undefined}
        actions={
          <Button
            onClick={addDimensionDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={UOM.dim.add}
          >
            Add Dimension
          </Button>
        }
      />

      <PageContent>
        <PermissionGate
          permission={UOM.dim.view}
          fallback={({ reason, title, tip }) => (
            <PageContentPanel
              isEmpty
              emptyState={<Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />}
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
