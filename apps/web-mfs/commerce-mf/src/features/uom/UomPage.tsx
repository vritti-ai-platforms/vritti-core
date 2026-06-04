import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Plus } from 'lucide-react';
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
          <Button onClick={addDimensionDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Dimension
          </Button>
        }
      />

      <PageContent>
        <UomDimensionsPanel selectedId={selectedDimensionId} onSelect={setSelectedDimensionId} />
        <UomDimensionDetailPanel dimensionId={selectedDimensionId} onDeleted={() => setSelectedDimensionId(null)} />
      </PageContent>

      <Dialog
        handle={addDimensionDialog}
        title="Add Dimension"
        description="Create a new UOM dimension."
        content={(close) => <AddUomDimensionDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
