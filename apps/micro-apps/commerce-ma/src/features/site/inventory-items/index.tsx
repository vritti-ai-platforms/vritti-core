import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
// Side-effect: registers this feature's Apollo cache policies at module eval (before any screen queries).
import './cache';
import { InventoryItemCreate } from './screens/InventoryItemCreateScreen';
import { InventoryItemDetail, InventoryItemDetailHeader } from './screens/InventoryItemDetailScreen';
import { InventoryItemEdit } from './screens/InventoryItemEditScreen';
import { InventoryList } from './screens/InventoryListScreen';
import type { InventoryRoute } from './types';

const screens: ReadonlyArray<PushScreenConfig<InventoryRoute>> = [
  {
    name: 'InventoryList',
    component: InventoryList,
    header: () => (
      <ScreenHeader
        title="Inventory Items"
        subtitle="Browse and manage your stock items"
        searchable
        searchPlaceholder="Search by name or code"
        createLabel="Create item"
      />
    ),
  },
  {
    name: 'InventoryItemDetail',
    component: InventoryItemDetail,
    header: () => <InventoryItemDetailHeader />,
  },
  {
    name: 'InventoryItemCreate',
    component: InventoryItemCreate,
    headerShown: true,
    title: 'New Item',
  },
  {
    name: 'InventoryItemEdit',
    component: InventoryItemEdit,
    headerShown: true,
    title: 'Edit Item',
  },
];

export default function InventoryItemsScreen() {
  return <PushNavigator<InventoryRoute> initialRoute="InventoryList" screens={screens} />;
}
