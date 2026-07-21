import { useNavigation } from '@react-navigation/native';
import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { type MenuAction, MenuButton } from '@vritti/quantum-ui-native/MenuButton';
import { useDeleteUomDimension } from '../../../../hooks/organization/uom-dimensions';
import type { UomDimension } from '../../../../types/uom-dimensions';

interface UomDimensionActionsMenuProps {
  dimension: UomDimension;
  onEdit: () => void;
}

// Overflow "⋯" menu rendered into the detail screen's default header. Edit opens the screen-owned sheet
// (propped); delete is owned here (mutation + goBack + MenuButton's confirm). Actions are built from a
// capability-keyed config filtered by the entity's flags — no if-push chains.
export function UomDimensionActionsMenu({ dimension, onEdit }: UomDimensionActionsMenuProps) {
  const navigation = useNavigation();
  const [deleteDimension] = useDeleteUomDimension();

  const handleDelete = async () => {
    const result = await deleteDimension({ variables: { id: dimension.id } });
    if (!result.error) navigation.goBack();
  };

  const defs: Array<MenuAction & { cap: 'canEdit' | 'canDelete' }> = [
    {
      cap: 'canEdit',
      key: 'edit',
      title: 'Edit dimension',
      sfSymbol: 'pencil',
      androidIconName: 'ic_menu_edit',
      permission: ORG_UOM.dim.edit,
      onSelect: onEdit,
    },
    {
      cap: 'canDelete',
      key: 'delete',
      title: 'Delete dimension',
      sfSymbol: 'trash',
      androidIconName: 'ic_menu_delete',
      destructive: true,
      permission: ORG_UOM.dim.delete,
      lockedPresentation: 'alert',
      onSelect: handleDelete,
      confirm: { name: dimension.name, message: `The "${dimension.name}" dimension will be removed. This can't be undone.` },
    },
  ];
  
  const actions: MenuAction[] = defs.filter((d) => dimension[d.cap]).map(({ cap, ...action }) => action);
  if (actions.length === 0) return null;

  return (
    // ghost, not glass: this renders inside the NATIVE-stack header, and iOS 26 wraps header items in its
    // own glass capsule — a glass Button there stacks a second glass circle inside it.
    <MenuButton actions={actions} variant="ghost" accessibilityLabel="Dimension actions" />
  );
}
