import { ORG_COST_CATEGORIES } from '@vritti/commerce-permissions/cost-categories';
import { type MenuAction, MenuButton } from '@vritti/quantum-ui-native/MenuButton';
import type { CostCategory } from '../../../../types/cost-categories';

interface CostCategoryActionsMenuProps {
  category: CostCategory;
  onToggleActive: (category: CostCategory) => void;
  onDelete: (category: CostCategory) => void;
}

// Card overflow menu: Activate/Deactivate (always) + Delete (only when canDelete — system/referenced rows
// can be deactivated but not deleted). Presentational — the screen owns the mutations/confirm.
export function CostCategoryActionsMenu({ category, onToggleActive, onDelete }: CostCategoryActionsMenuProps) {
  const actions: MenuAction[] = [
    {
      key: 'toggle',
      title: category.isActive ? 'Deactivate' : 'Activate',
      sfSymbol: category.isActive ? 'pause.circle' : 'checkmark.circle',
      permission: ORG_COST_CATEGORIES.edit,
      onSelect: () => onToggleActive(category),
    },
  ];
  if (category.canDelete) {
    actions.push({
      key: 'delete',
      title: 'Delete',
      sfSymbol: 'trash',
      destructive: true,
      permission: ORG_COST_CATEGORIES.delete,
      lockedPresentation: 'alert',
      onSelect: () => onDelete(category),
    });
  }

  return <MenuButton actions={actions} accessibilityLabel="Cost category actions" />;
}
