import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { CompactSwitch } from '@vritti/quantum-ui/Switch';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MoreVertical, Pencil, Plus, SwatchBook, Trash2 } from 'lucide-react';
import type React from 'react';
import type { DimensionTemplateData } from '@/schemas/dimension-templates';
import { EditDimensionTemplateDialog } from './forms/EditDimensionTemplateDialog';
import { TemplateValuesDialog } from './forms/TemplateValuesDialog';
import type { DimensionTemplatePermissions } from './types';

const OWNER_LABEL: Record<DimensionTemplateData['ownerScope'], string> = {
  ORG: 'Organization',
  LE: 'Company',
  SITE: 'Outlet',
};

interface DimensionTemplateCardProps {
  permissions: DimensionTemplatePermissions;
  template: DimensionTemplateData;
  isDeleting: boolean;
  isTogglingActive: boolean;
  onDelete: (template: DimensionTemplateData) => void;
  onToggleActive: (template: DimensionTemplateData, isActive: boolean) => void;
}

export const DimensionTemplateCard: React.FC<DimensionTemplateCardProps> = ({
  permissions,
  template,
  isDeleting,
  isTogglingActive,
  onDelete,
  onToggleActive,
}) => {
  const valuesDialog = useDialog();
  const noValues = template.valueCount === 0;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography variant="body1" className="truncate font-medium">
            {template.name}
          </Typography>
          <Typography variant="caption" className="block truncate font-mono text-muted-foreground">
            {template.code}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {pluralize('value', template.valueCount, true)}
          </Typography>
        </div>
        <div className="flex flex-none items-center gap-1">
          <Badge variant="outline">{OWNER_LABEL[template.ownerScope]}</Badge>
          <DropdownMenu
            trigger={{
              children: (
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              ),
            }}
            items={[
              {
                type: 'dialog',
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: permissions.edit,
                // A template owned by a wider scope is read-only here, so the action is hidden
                // rather than shown greyed out — there is nothing the user can do to enable it
                hidden: !template.canEdit,
                dialog: {
                  title: 'Edit Dimension Template',
                  description: 'Rename the template or change what it is for.',
                  content: (close) => (
                    <EditDimensionTemplateDialog template={template} onSuccess={close} onCancel={close} />
                  ),
                },
              },
              {
                type: 'item',
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                permission: permissions.delete,
                variant: 'destructive',
                hidden: !template.canDelete,
                disabled: isDeleting,
                onClick: () => onDelete(template),
              },
            ]}
          />
        </div>
      </div>

      {template.description ? (
        <Typography variant="body2" className="line-clamp-2 text-muted-foreground">
          {template.description}
        </Typography>
      ) : null}

      {noValues && template.canEdit ? (
        <Button
          variant="outline"
          className="w-full border-dashed"
          startAdornment={<Plus className="size-4" />}
          permission={permissions.values.upsert}
          onClick={valuesDialog.open}
        >
          Add values
        </Button>
      ) : noValues ? (
        <Typography variant="caption" className="text-muted-foreground italic">
          No values yet
        </Typography>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {template.values.map((value) => (
            <span
              key={value.id}
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-sm"
            >
              {value.value}
              <span className="font-mono text-muted-foreground text-xs">{value.code}</span>
            </span>
          ))}
          {template.canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground text-xs"
              startAdornment={<Pencil className="size-3" />}
              permission={permissions.values.upsert}
              onClick={valuesDialog.open}
            >
              Edit
            </Button>
          ) : null}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <Typography variant="caption" className="text-muted-foreground">
          {template.isActive ? 'Active' : 'Inactive'}
        </Typography>
        <CompactSwitch
          checked={template.isActive}
          permission={permissions.toggle}
          // A template with no values cannot be switched on — the server refuses it too
          disabled={!template.canEdit || noValues || isTogglingActive}
          disabledTip={noValues ? 'Add a value before activating' : undefined}
          onCheckedChange={(isActive) => onToggleActive(template, isActive)}
          aria-label={`Activate ${template.name}`}
        />
      </div>
      <Dialog
        handle={valuesDialog}
        icon={SwatchBook}
        title={noValues ? 'Add Values' : 'Edit Values'}
        description={`The complete set of values "${template.name}" seeds onto a dimension.`}
        content={(close) => <TemplateValuesDialog template={template} onSuccess={close} onCancel={close} />}
      />
    </Card>
  );
};
