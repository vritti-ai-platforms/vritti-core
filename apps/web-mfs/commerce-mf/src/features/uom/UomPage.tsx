import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { keyBy } from '@vritti/quantum-ui/lodash';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBaseUnits, useDerivedUnits } from '@/hooks/useUom';
import { UomDetailPanel, UomEmptyState, UomListPanel } from './components';
import { AddBaseUnitDialog } from './forms/AddBaseUnitDialog';

export const UomPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: baseUnits } = useBaseUnits(searchQuery);
  const addBaseDialog = useDialog();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const baseUnitsMap = useMemo(() => keyBy(baseUnits, (bu) => bu.id), [baseUnits]);
  const selectedBaseUnit = selectedId ? (baseUnitsMap[selectedId] ?? null) : null;
  const { data: derivedUnits = [], isLoading: isDerivedLoading } = useDerivedUnits(selectedId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Units of Measure"
        description={`${baseUnits.length} base unit${baseUnits.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={addBaseDialog.open} startAdornment={<Plus className="size-4" />}>
            Add Base Unit
          </Button>
        }
      />

      <PageContent>
        <UomListPanel
          baseUnits={baseUnits}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSelect={setSelectedId}
          onSearch={setSearchQuery}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {selectedBaseUnit ? (
            <UomDetailPanel
              baseUnit={selectedBaseUnit}
              derivedUnits={derivedUnits}
              isDerivedLoading={isDerivedLoading}
              onBaseDeleted={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex-1 overflow-auto p-6 flex flex-col">
              <UomEmptyState />
            </div>
          )}
        </div>
      </PageContent>

      <Dialog
        handle={addBaseDialog}
        title="Add Base Unit"
        description="Create a new base unit of measure."
        content={(close) => <AddBaseUnitDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
