import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { Map as MapIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { TAX_JURISDICTIONS_KEY, useTaxJurisdictionCount } from '@/hooks/organization/tax-jurisdictions';
import { JurisdictionDetailPanel, JurisdictionTreePanel } from './components';
import { AddJurisdictionDialog } from './forms/AddJurisdictionDialog';

export const TaxJurisdictionsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: jurisdictionCount } = useTaxJurisdictionCount();
  const formDialog = useDialog();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Jurisdictions"
        description={
          jurisdictionCount
            ? `${jurisdictionCount.count} total jurisdictions`
            : 'The geography your registrations and rates key off — country, state, city…'
        }
        actions={
          <Button
            onClick={formDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={ORG_TAX_JURISDICTIONS.add}
          >
            Add Jurisdiction
          </Button>
        }
      />

      <PageContent>
        <PermissionGate permission={ORG_TAX_JURISDICTIONS.view}>
          <JurisdictionTreePanel selectedId={selectedId} onSelect={setSelectedId} />
          <JurisdictionDetailPanel jurisdictionId={selectedId} onSelectJurisdiction={setSelectedId} />
        </PermissionGate>
      </PageContent>

      <Dialog
        handle={formDialog}
        icon={MapIcon}
        title="Add Jurisdiction"
        description="Enter the details for the new tax jurisdiction."
        content={(close) => (
          <AddJurisdictionDialog
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: TAX_JURISDICTIONS_KEY });
              close();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
