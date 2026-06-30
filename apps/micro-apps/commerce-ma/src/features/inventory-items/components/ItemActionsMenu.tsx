import { useNavigation } from '@react-navigation/native';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { useConfirm, usePlatformInfo } from '@vritti/quantum-ui-native/hooks';
import { type MenuAction, MenuButton } from '@vritti/quantum-ui-native/MenuButton';
import { Alert } from 'react-native';
import { useDeleteInventoryItem } from '../../../hooks/inventory-items';
import type { InventoryItem } from '../../../types/inventory-items';
import type { InventoryNavigation } from '../types';

// iOS 26's liquid-glass trigger carries the bare dots; pre-iOS 26 + Android (flat ghost trigger) use an
// outlined (circled) icon so it reads as a button on the flat background.
const MENU_ICON_GLASS = { sfSymbol: 'ellipsis', materialSymbol: 'more_vert' } as const;
const MENU_ICON_OUTLINED = { sfSymbol: 'ellipsis.circle', materialSymbol: 'more_vert' } as const;

// Detail-header overflow menu: Edit / Delete for the item, rendered as a native menu (MenuButton).
// Replaces the in-body Edit button + Danger-zone delete card now that the tabs header has a rightActions slot.
export function ItemActionsMenu({ item }: { item: InventoryItem }) {
  const navigation = useNavigation() as unknown as InventoryNavigation;
  const confirm = useConfirm();
  const platform = usePlatformInfo();
  const menuIcon = platform.os === 'ios' && platform.version >= 26 ? MENU_ICON_GLASS : MENU_ICON_OUTLINED;
  const [deleteItem, { loading: deleting }] = useDeleteInventoryItem();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${item.name}?`,
      description: `${item.name} will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!confirmed) return;
    // cache.evict drops the row from the list automatically; return to it on success.
    const result = await deleteItem({ variables: { id: item.id } });
    if (result.error) {
      Alert.alert('Delete failed', result.error.message);
      return;
    }
    navigation.goBack();
  };

  const actions: MenuAction[] = [
    {
      key: 'edit',
      title: 'Edit item',
      sfSymbol: 'pencil',
      onSelect: () => navigation.navigate('InventoryItemEdit', { id: item.id }),
    },
    {
      key: 'delete',
      title: 'Delete item',
      sfSymbol: 'trash',
      destructive: true,
      // Disabled when the item is referenced by other records (mirrors the web), or mid-delete.
      disabled: !item.canDelete || deleting,
      onSelect: handleDelete,
    },
  ];

  return (
    <MenuButton actions={actions} accessibilityLabel="Item actions">
      <DynamicIcon icon={menuIcon} size={24} />
    </MenuButton>
  );
}
