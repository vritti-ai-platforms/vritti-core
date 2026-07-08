import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { type MenuAction, MenuButton } from '@vritti/quantum-ui-native/MenuButton';
import type { UomDimension } from '../../../types/uom-dimensions';

const MENU_ICON = { sfSymbol: 'ellipsis', materialSymbol: 'more_vert' } as const;

interface UomDimensionActionsMenuProps {
  dimension: UomDimension;
  onEdit: () => void;
  onDelete: () => void;
}

// Overflow "⋯" menu rendered into the detail screen's default header (via navigation.setOptions). Purely
// presentational — the body owns the edit sheet + delete logic and passes them in. Actions are hidden (not
// just disabled) when not permitted, matching the list card / web behavior.
export function UomDimensionActionsMenu({ dimension, onEdit, onDelete }: UomDimensionActionsMenuProps) {
  const actions: MenuAction[] = [];
  if (dimension.canEdit) {
    actions.push({
      key: 'edit',
      title: 'Edit dimension',
      sfSymbol: 'pencil',
      androidIconName: 'ic_menu_edit',
      onSelect: onEdit,
    });
  }
  if (dimension.canDelete) {
    actions.push({
      key: 'delete',
      title: 'Delete dimension',
      sfSymbol: 'trash',
      androidIconName: 'ic_menu_delete',
      destructive: true,
      onSelect: onDelete,
    });
  }
  if (actions.length === 0) return null;

  return (
    <MenuButton actions={actions} accessibilityLabel="Dimension actions">
      <DynamicIcon icon={MENU_ICON} size={24} />
    </MenuButton>
  );
}
