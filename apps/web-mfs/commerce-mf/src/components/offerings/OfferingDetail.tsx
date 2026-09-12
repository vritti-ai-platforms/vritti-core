import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil, Receipt } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusSwitch } from '@/components/StatusSwitch';
import type { OfferingsBinding } from './bindings';
import { EditOfferingDialog } from './forms/EditOfferingDialog';
import { SetTaxClassDialog } from './forms/SetTaxClassDialog';
import { DimensionsTab } from './tabs/DimensionsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { VariantsTab } from './tabs/VariantsTab';

interface OfferingDetailProps {
  binding: OfferingsBinding;
}

export const OfferingDetail: React.FC<OfferingDetailProps> = ({ binding }) => {
  const { permissions: PERMISSIONS } = binding;
  const { id } = useSlugParams('slug');
  const { data: offering } = binding.useOffering(id);
  const navigate = useNavigate();
  const editDialog = useDialog();
  const taxClassDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = binding.useDeleteOffering();
  const setStatusMutation = binding.useSetOfferingStatus();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${offering.name}"?`,
      description: 'The offering and its dimensions will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(offering.id, { onSuccess: () => navigate('..') });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title={offering.name}
        description={offering.code}
        titleSlot={
          <StatusSwitch
            size="md"
            checked={offering.isActive}
            permission={PERMISSIONS.toggle}
            disabled={!offering.canMarkActive || setStatusMutation.isPending}
            disabledTip={offering.canEdit ? 'Generate a variant first' : 'This offering belongs to a wider scope.'}
            onCheckedChange={(isActive) => setStatusMutation.mutate({ id: offering.id, isActive })}
            ariaLabel={`Mark ${offering.name} active`}
          />
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              startAdornment={<Receipt className="size-4" />}
              onClick={taxClassDialog.open}
              disabled={!offering.canEdit}
              disabledTip={offering.canEdit ? undefined : 'This offering belongs to a wider scope.'}
              permission={PERMISSIONS.edit}
            >
              Change Tax Class
            </Button>
            <Button
              variant="outline"
              size="sm"
              startAdornment={<Pencil className="size-4" />}
              onClick={editDialog.open}
              disabled={!offering.canEdit}
              disabledTip={offering.canEdit ? undefined : 'This offering belongs to a wider scope.'}
              permission={PERMISSIONS.edit}
            >
              Edit
            </Button>
          </div>
        }
      />

      <Tabs
        routeParam="tab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab offering={offering} />,
          },
          {
            value: 'dimensions',
            label: 'Dimensions',
            permission: PERMISSIONS.dimensions.view,
            content: (
              <DimensionsTab
                permissions={PERMISSIONS}
                offering={offering}
                useDimensions={binding.useDimensions}
                useCreate={binding.useCreateDimension}
                useCreateFromTemplate={binding.useCreateDimensionFromTemplate}
                useUpsertValues={binding.useUpsertDimensionValues}
                useUpdate={binding.useUpdateDimension}
                useReorder={binding.useReorderDimensions}
                useDelete={binding.useDeleteDimension}
              />
            ),
          },
          {
            value: 'variants',
            label: 'Variants',
            permission: PERMISSIONS.variants.view,
            content: (
              <VariantsTab
                permissions={PERMISSIONS}
                offering={offering}
                useVariantsTable={binding.useVariantsTable}
                useDimensions={binding.useDimensions}
                useCreateVariant={binding.useCreateVariant}
                useDelete={binding.useDeleteVariant}
                useUpdate={binding.useUpdateVariant}
                useBulkSetStatus={binding.useBulkSetVariantsStatus}
                tableKey={binding.variantsTableKey(offering.id)}
                tableSlug={binding.variantsTableSlug(offering.id)}
              />
            ),
          },
        ]}
      />

      <DangerZone
        title="Delete this offering"
        description="This action cannot be undone. Its dimensions and their values will be removed with it."
        buttonText="Delete Offering"
        permission={PERMISSIONS.delete}
        onClick={handleDelete}
        disabled={!offering.canDelete}
        warning={
          offering.variantCount > 0
            ? `This offering has ${pluralize('variant', offering.variantCount, true)}. Delete them first.`
            : 'This offering belongs to a wider scope. Switch to the workspace that owns it.'
        }
        showWarning={!offering.canDelete}
      />

      <Dialog
        handle={taxClassDialog}
        icon={Receipt}
        title="Change Tax Class"
        description={`Applies to ${offering.name} and its variants`}
        content={(close) => (
          <SetTaxClassDialog
            useSet={binding.useSetOfferingTaxClass}
            offering={offering}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Offering"
        description="Fulfilment type is fixed. Changing the code only affects SKUs derived from here on."
        content={(close) => (
          <EditOfferingDialog
            offering={offering}
            useUpdate={binding.useUpdateOffering}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
