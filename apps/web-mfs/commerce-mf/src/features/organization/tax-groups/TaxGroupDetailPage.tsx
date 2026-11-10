import { ORG_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { countryFlag } from '@vritti/quantum-ui/selects/iso-country';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Percent } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteTaxGroup, useSetTaxGroupActive, useTaxGroup } from '@/hooks/organization/tax-groups';
import { TaxTreatmentBadge } from './components/TaxTreatmentBadge';
import { EditTaxGroupDialog } from './forms/EditTaxGroupDialog';
import { ClassesTab } from './tabs/classes/ClassesTab';
import { OverviewTab } from './tabs/OverviewTab';
import { RatesTab } from './tabs/rates/RatesTab';

export const TaxGroupDetailPage = () => {
  const { id } = useSlugParams('taxGroupSlug');
  const navigate = useNavigate();
  const { data: taxGroup } = useTaxGroup(id);
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteTaxGroup();
  const setActiveMutation = useSetTaxGroupActive();
  const inUseTip = `Mapped to ${pluralize('tax class', taxGroup.classCount, true)}. Remove the mappings first.`;

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete "${taxGroup.name}"?`,
      description: `${taxGroup.name} and its ${pluralize('rate', taxGroup.rateCount, true)} will be permanently removed. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(taxGroup.id, { onSuccess: () => navigate('../..', { relative: 'path' }) });
  }, [confirm, deleteMutation, navigate, taxGroup]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={taxGroup.name}
        description={`${countryFlag(taxGroup.countryCode)} ${taxGroup.countryCode} · ${taxGroup.code}`}
        titleSlot={
          <div className="flex items-center gap-2">
            <TaxTreatmentBadge treatment={taxGroup.treatment} />
            <StatusSwitch
              size="md"
              checked={taxGroup.isActive}
              permission={ORG_TAX_GROUPS.toggle}
              disabled={taxGroup.isActive && !taxGroup.canDeactivate}
              disabledTip="Tax classes are mapped to this group today or from a later day. End those mappings first."
              isLoading={setActiveMutation.isPending}
              onCheckedChange={(isActive) => setActiveMutation.mutate({ id: taxGroup.id, isActive })}
              ariaLabel={`Mark ${taxGroup.name} active`}
            />
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={ORG_TAX_GROUPS.edit}
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
            permission: ORG_TAX_GROUPS.view,
            content: <OverviewTab taxGroup={taxGroup} />,
          },
          {
            value: 'rates',
            label: `Rates (${taxGroup.rateCount})`,
            permission: ORG_TAX_GROUPS.rates.view,
            content: <RatesTab taxGroup={taxGroup} />,
          },
          {
            value: 'classes',
            label: `Classes (${taxGroup.classCount})`,
            permission: ORG_TAX_GROUPS.classes.view,
            content: <ClassesTab taxGroup={taxGroup} />,
          },
        ]}
      />

      <Dialog
        handle={editDialog}
        icon={Percent}
        title="Edit Tax Group"
        description="Update the tax group. Its country is fixed."
        content={(close) => <EditTaxGroupDialog taxGroup={taxGroup} onSuccess={close} onCancel={close} />}
      />

      <DangerZone
        title="Delete this tax group"
        description="This removes the group and its rates and cannot be undone. Groups tax classes are mapped to cannot be deleted."
        buttonText="Delete Tax Group"
        permission={ORG_TAX_GROUPS.delete}
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        disabled={!taxGroup.canDelete || deleteMutation.isPending}
        warning={inUseTip}
        showWarning={!taxGroup.canDelete}
      />
    </div>
  );
};
