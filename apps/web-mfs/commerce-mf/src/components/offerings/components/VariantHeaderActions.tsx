import { Button } from '@vritti/quantum-ui/Button';
import type { MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { MoreVertical, Receipt, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { OfferingVariantData } from '@/schemas/offerings';
import { SetVariantTaxClassDialog } from '../forms/SetTaxClassDialog';
import type { OfferingPermissions, UseClearVariantTaxClass, UseSetVariantTaxClass } from '../types';

interface VariantHeaderActionsProps {
  permissions: OfferingPermissions;
  variant: OfferingVariantData;
  useSetTaxClass: UseSetVariantTaxClass;
  useClearTaxClass: UseClearVariantTaxClass;
}

export const VariantHeaderActions: React.FC<VariantHeaderActionsProps> = ({
  permissions,
  variant,
  useSetTaxClass,
  useClearTaxClass,
}) => {
  const clearMutation = useClearTaxClass();

  const items = useMemo<MenuItem[]>(() => {
    const entries: MenuItem[] = [
      {
        type: 'dialog',
        id: 'override',
        label: 'Override Tax Class',
        icon: Receipt,
        permission: permissions.variants.setTaxClass,
        dialog: {
          title: 'Override Tax Class',
          description: `Pins a tax class to ${variant.sku}, exempting it from the offering's cascade`,
          content: (close) => (
            <SetVariantTaxClassDialog useSet={useSetTaxClass} variant={variant} onSuccess={close} onCancel={close} />
          ),
        },
      },
    ];
    // Only offered once pinned — rejoining a cascade it never left is meaningless
    if (variant.isTaxClassOverridden) {
      entries.push({
        type: 'item',
        id: 'remove-override',
        label: 'Remove Override',
        icon: RotateCcw,
        permission: permissions.variants.setTaxClass,
        onClick: () => clearMutation.mutate(variant.id),
      });
    }
    return entries;
  }, [variant, useSetTaxClass, clearMutation, permissions.variants.setTaxClass]);

  return (
    <DropdownMenu
      trigger={{
        children: (
          <Button size="sm" variant="outline" endAdornment={<MoreVertical className="size-4" />}>
            Actions
          </Button>
        ),
      }}
      items={items}
      align="end"
    />
  );
};
