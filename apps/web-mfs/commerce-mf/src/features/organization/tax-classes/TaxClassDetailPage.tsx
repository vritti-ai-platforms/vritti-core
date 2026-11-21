import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteTaxClass,
  useSetTaxClassActive,
  useTaxClass,
  useTaxClassCounts,
} from '@/hooks/organization/tax-classes';
import { EditTaxClassDialog } from './forms/EditTaxClassDialog';
import { GroupsTab } from './tabs/groups/GroupsTab';
import { OverviewTab } from './tabs/OverviewTab';

export const TaxClassDetailPage = () => {
  const { id } = useSlugParams('taxClassSlug');
  const navigate = useNavigate();
  const { data: taxClass } = useTaxClass(id);
  const { data: counts, isLoading: countsLoading } = useTaxClassCounts(id);
  const editDialog = useDialog();
  const deleteMutation = useDeleteTaxClass();
  const setActiveMutation = useSetTaxClassActive();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={taxClass.name}
        description={taxClass.code}
        titleSlot={
          <div className="flex items-center gap-2">
            <StatusSwitch
              size="md"
              checked={taxClass.isActive}
              permission={ORG_TAX_CLASSES.toggle}
              isLoading={setActiveMutation.isPending}
              onCheckedChange={(isActive) => setActiveMutation.mutate({ id: taxClass.id, isActive })}
              ariaLabel={`Mark ${taxClass.name} active`}
            />
            {taxClass.isSystem && <Badge variant="outline">System</Badge>}
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={ORG_TAX_CLASSES.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
          >
            Edit
          </Button>
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_TAX_CLASSES.view,
            content: <OverviewTab taxClass={taxClass} />,
          },
          {
            value: 'groups',
            label: 'Groups',
            count: counts?.groupCount,
            countLoading: countsLoading,
            permission: ORG_TAX_CLASSES.groups.view,
            content: <GroupsTab taxClass={taxClass} />,
          },
        ]}
      />

      <Dialog
        handle={editDialog}
        icon={Tags}
        title="Edit Tax Class"
        description="Rename the tax class. Code is immutable."
        content={(close) => <EditTaxClassDialog taxClass={taxClass} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this tax class"
        description="This removes the class and its group mappings and cannot be undone. System tax classes cannot be deleted."
        buttonText="Delete Tax Class"
        permission={ORG_TAX_CLASSES.delete}
        confirm={{
          title: `Delete "${taxClass.name}"?`,
          description: `${taxClass.name} and its group mappings will be permanently removed. This action cannot be undone.`,
          confirmLabel: 'Delete',
          variant: 'destructive',
        }}
        onClick={() => deleteMutation.mutate(taxClass.id, { onSuccess: () => navigate('../..', { relative: 'path' }) })}
        isLoading={deleteMutation.isPending}
        disabled={!taxClass.canDelete || deleteMutation.isPending}
        warning="This tax class is reserved by the system."
        showWarning={!taxClass.canDelete}
      />
    </div>
  );
};
