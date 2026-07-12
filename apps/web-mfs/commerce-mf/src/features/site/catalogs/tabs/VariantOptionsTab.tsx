import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { BookOpen } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { VariantOptionDetailPanel } from '../components/options/VariantOptionDetailPanel';
import { VariantOptionsPanel } from '../components/options/VariantOptionsPanel';
import { VariantOptionDialog } from '../forms/options/VariantOptionDialog';

interface VariantOptionsTabProps {
  catalogId: string;
}

export const VariantOptionsTab: React.FC<VariantOptionsTabProps> = ({ catalogId }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const addDialog = useDialog();

  return (
    <>
      <PageContent>
        <VariantOptionsPanel
          catalogId={catalogId}
          selectedId={selectedOptionId}
          onSelect={setSelectedOptionId}
          onAddOption={addDialog.open}
        />
        <VariantOptionDetailPanel
          catalogId={catalogId}
          optionId={selectedOptionId}
          onDeleted={() => setSelectedOptionId(null)}
        />
      </PageContent>

      <Dialog
        handle={addDialog}
        icon={BookOpen}
        title="Add option"
        description="Define a dimension (e.g. Size) and its values."
        content={(close) => <VariantOptionDialog catalogId={catalogId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
