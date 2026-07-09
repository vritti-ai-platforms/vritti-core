import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { type MenuAction, MenuButton } from '@vritti/quantum-ui-native/MenuButton';
import type { CostCategory } from '../../../types/cost-categories';

// iOS 26's liquid-glass trigger carries the bare dots; pre-iOS 26 + Android use an outlined (circled) icon
// so it reads as a button on the flat background.
const MENU_ICON_GLASS = { sfSymbol: 'ellipsis', materialSymbol: 'more_vert' } as const;
const MENU_ICON_OUTLINED = { sfSymbol: 'ellipsis.circle', materialSymbol: 'more_vert' } as const;

interface CostCategoryActionsMenuProps {
  category: CostCategory;
  onToggleActive: (category: CostCategory) => void;
  onDelete: (category: CostCategory) => void;
}

// Card overflow menu: Activate/Deactivate (always) + Delete (only when canDelete — system/referenced rows
// can be deactivated but not deleted). Presentational — the screen owns the mutations/confirm.
export function CostCategoryActionsMenu({ category, onToggleActive, onDelete }: CostCategoryActionsMenuProps) {
  const platform = usePlatformInfo();
  const menuIcon = platform.os === 'ios' && platform.version >= 26 ? MENU_ICON_GLASS : MENU_ICON_OUTLINED;

  const actions: MenuAction[] = [
    {
      key: 'toggle',
      title: category.isActive ? 'Deactivate' : 'Activate',
      sfSymbol: category.isActive ? 'pause.circle' : 'checkmark.circle',
      onSelect: () => onToggleActive(category),
    },
  ];
  if (category.canDelete) {
    actions.push({
      key: 'delete',
      title: 'Delete',
      sfSymbol: 'trash',
      destructive: true,
      onSelect: () => onDelete(category),
    });
  }

  return (
    <MenuButton actions={actions} accessibilityLabel="Cost category actions">
      <DynamicIcon icon={menuIcon} size={24} />
    </MenuButton>
  );
}
