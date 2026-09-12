import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { MoreVertical, Pencil, Trash2, Wrench } from 'lucide-react';
import type React from 'react';
import type { BomLineData, OfferingVariantData } from '@/schemas/offerings';
import { EditBomLineDialog } from '../forms/BomLineDialog';
import type { OfferingPermissions, UseUpdateBomLine } from '../types';

interface BomLineCardProps {
  permissions: OfferingPermissions;
  variant: OfferingVariantData;
  line: BomLineData;
  useUpdate: UseUpdateBomLine;
  onRemove: (line: BomLineData) => void;
}

export const BomLineCard: React.FC<BomLineCardProps> = ({ permissions, variant, line, useUpdate, onRemove }) => {
  // The card owns its edit dialog, so the list above it holds no "which row is open" state
  const editDialog = useDialog();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="font-medium">{line.inventoryItemName}</div>
          <div className="font-mono text-muted-foreground text-xs">{line.inventoryItemSku}</div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex-none font-mono text-sm">
            {line.quantity} {line.uomName}
          </span>
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
                permission: permissions.variants.bom.edit,
                onClick: editDialog.open,
              },
              {
                type: 'item',
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: permissions.variants.bom.delete,
                onClick: () => onRemove(line),
              },
            ]}
          />
        </div>
      </CardContent>

      <Dialog
        handle={editDialog}
        icon={Wrench}
        title="Edit Component"
        description={line.inventoryItemName}
        content={(close) => (
          <EditBomLineDialog variant={variant} line={line} useUpdate={useUpdate} onSuccess={close} onCancel={close} />
        )}
      />
    </Card>
  );
};
