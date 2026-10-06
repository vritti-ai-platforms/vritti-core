import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SortableDragHandle } from '@vritti/quantum-ui/Sortable';
import { GripVertical, MoreVertical, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import type React from 'react';
import type { OfferingAttributeData } from '@/schemas/offerings';
import { AttributeValuesDialog } from '../forms/AttributeValuesDialog';
import { EditAttributeDialog } from '../forms/EditAttributeDialog';
import type { OfferingPermissions, UseUpdateAttribute, UseUpsertAttributeValues } from '../types';

interface AttributeCardProps {
  permissions: OfferingPermissions;
  attribute: OfferingAttributeData;
  canEdit: boolean;
  useUpsertValues: UseUpsertAttributeValues;
  useUpdate: UseUpdateAttribute;
  onDelete: (attribute: OfferingAttributeData) => void;
}

export const AttributeCard: React.FC<AttributeCardProps> = ({
  permissions,
  attribute,
  canEdit,
  useUpsertValues,
  useUpdate,
  onDelete,
}) => {
  // The card owns its values dialog, so the list above it holds no "which row is open" state
  const valuesDialog = useDialog();
  const editDialog = useDialog();
  const noValues = attribute.valueCount === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <SortableDragHandle className="mt-0.5 grid size-5 cursor-grab place-items-center rounded text-muted-foreground hover:bg-muted">
            <GripVertical className="size-3.5" />
          </SortableDragHandle>
          <div>
            <div className="flex items-center gap-2 font-medium">
              {attribute.name}
              <span className="font-mono text-muted-foreground text-xs">{attribute.code}</span>
            </div>
            {attribute.description ? (
              <span className="block text-muted-foreground text-xs">{attribute.description}</span>
            ) : null}
            <span className="text-muted-foreground text-xs">{pluralize('value', attribute.valueCount, true)}</span>
          </div>
        </div>
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
              type: 'item',
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              hidden: !canEdit,
              permission: permissions.attributes.edit,
              onClick: editDialog.open,
            },
            {
              type: 'item',
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              hidden: !canEdit,
              permission: permissions.attributes.delete,
              disabled: !attribute.canDelete,
              onClick: () => onDelete(attribute),
            },
          ]}
        />
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {noValues ? (
          <Button
            variant="outline"
            size="sm"
            onClick={valuesDialog.open}
            startAdornment={<Plus className="size-4" />}
            permission={permissions.attributes.edit}
          >
            Add values
          </Button>
        ) : (
          <>
            {attribute.values.map((value) => (
              <span
                key={value.id}
                className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-sm"
              >
                {value.value}
                <span className="font-mono text-muted-foreground text-xs">{value.code}</span>
              </span>
            ))}
            {canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground text-xs"
                startAdornment={<Pencil className="size-3" />}
                permission={permissions.attributes.edit}
                onClick={valuesDialog.open}
              >
                Edit
              </Button>
            ) : null}
          </>
        )}
      </CardContent>

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Attribute"
        description={attribute.code}
        content={(close) => (
          <EditAttributeDialog useUpdate={useUpdate} attribute={attribute} onSuccess={close} onCancel={close} />
        )}
      />

      <Dialog
        handle={valuesDialog}
        icon={Tags}
        title={noValues ? 'Add Values' : 'Edit Values'}
        description="A variant carries any number of these. Values already used by a variant cannot be deleted."
        content={(close) => (
          <AttributeValuesDialog attribute={attribute} useUpsert={useUpsertValues} onSuccess={close} onCancel={close} />
        )}
      />
    </Card>
  );
};
