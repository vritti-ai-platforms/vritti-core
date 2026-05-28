import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import {
  ScreenHeader,
  type ScreenHeaderTabConfig,
  useScreenHeaderTabContent,
} from '@vritti/quantum-ui-native/ScreenHeader';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Pressable, View } from 'react-native';

type InventoryRoute = 'InventoryList';

type ItemStatus = 'active' | 'low-stock' | 'out-of-stock' | 'archived';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
  status: ItemStatus;
}

const STATUSES: ItemStatus[] = ['active', 'low-stock', 'out-of-stock', 'archived'];

const MOCK_ITEMS: InventoryItem[] = Array.from({ length: 30 }).map((_, i) => {
  const id = i + 1;
  const status = STATUSES[i % STATUSES.length] as ItemStatus;
  return {
    id,
    name: `Item ${id}`,
    sku: `SKU-${String(id).padStart(4, '0')}`,
    stock: status === 'out-of-stock' ? 0 : status === 'low-stock' ? Math.max(1, id % 5) : 10 + (id % 40),
    status,
  };
});

function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === 'active') {
    return (
      <View className="self-start rounded-full bg-success/15 px-2 py-0.5">
        <Text className="text-xs font-medium text-success">active</Text>
      </View>
    );
  }
  if (status === 'low-stock') {
    return (
      <View className="self-start rounded-full bg-warning/15 px-2 py-0.5">
        <Text className="text-xs font-medium text-warning">low stock</Text>
      </View>
    );
  }
  if (status === 'out-of-stock') {
    return (
      <View className="self-start rounded-full bg-destructive/15 px-2 py-0.5">
        <Text className="text-xs font-medium text-destructive">out of stock</Text>
      </View>
    );
  }
  return (
    <View className="self-start rounded-full bg-muted px-2 py-0.5">
      <Text className="text-xs font-medium text-muted-foreground">archived</Text>
    </View>
  );
}

function ItemList({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <View className="gap-3 p-4">
        <View className="items-center justify-center rounded-xl border border-border bg-card p-8">
          <Text className="text-base text-muted-foreground">No items in this view yet.</Text>
        </View>
      </View>
    );
  }
  return (
    <View className="gap-3 p-4">
      {items.map((item) => (
        <Pressable
          key={`item-${item.id}`}
          onPress={() => {}}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          className="gap-2 rounded-xl border border-border bg-card p-4"
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground">{item.name}</Text>
              <Text className="text-xs text-muted-foreground">{item.sku}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <Text className="text-sm text-muted-foreground">{item.stock} in stock</Text>
        </Pressable>
      ))}
    </View>
  );
}

const TABS: ScreenHeaderTabConfig[] = [
  {
    id: 'all',
    label: 'All',
    icon: { sfSymbol: 'square.grid.2x2', materialIcon: 'apps' },
    activeIcon: { sfSymbol: 'square.grid.2x2.fill', materialIcon: 'apps' },
    content: <ItemList items={MOCK_ITEMS} />,
  },
  {
    id: 'active',
    label: 'Active',
    icon: { sfSymbol: 'checkmark.circle', materialIcon: 'check-circle-outline' },
    activeIcon: { sfSymbol: 'checkmark.circle.fill', materialIcon: 'check-circle' },
    content: (
      <>
        <Text>HIIIII</Text>
      </>
    ),
  },
  {
    id: 'low-stock',
    label: 'Low stock',
    icon: { sfSymbol: 'exclamationmark.triangle', materialIcon: 'warning-amber' },
    activeIcon: { sfSymbol: 'exclamationmark.triangle.fill', materialIcon: 'warning' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.status === 'low-stock')} />,
  },
  {
    id: 'out-of-stock',
    label: 'Out of stock',
    icon: { sfSymbol: 'xmark.circle', materialIcon: 'highlight-off' },
    activeIcon: { sfSymbol: 'xmark.circle.fill', materialIcon: 'cancel' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.status === 'out-of-stock')} />,
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: { sfSymbol: 'archivebox', materialIcon: 'inventory-2' },
    activeIcon: { sfSymbol: 'archivebox.fill', materialIcon: 'inventory-2' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.status === 'archived')} />,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: { sfSymbol: 'star', materialIcon: 'star-outline' },
    activeIcon: { sfSymbol: 'star.fill', materialIcon: 'star' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.id % 2 === 0)} />,
  },
  {
    id: 'on-sale',
    label: 'On sale',
    icon: { sfSymbol: 'tag', materialIcon: 'label-outline' },
    activeIcon: { sfSymbol: 'tag.fill', materialIcon: 'label' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.stock > 20)} />,
  },
  {
    id: 'trending',
    label: 'Trending',
    icon: { sfSymbol: 'flame', materialIcon: 'whatshot' },
    activeIcon: { sfSymbol: 'flame.fill', materialIcon: 'whatshot' },
    content: <ItemList items={MOCK_ITEMS.slice(0, 8)} />,
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: { sfSymbol: 'clock', materialIcon: 'access-time' },
    activeIcon: { sfSymbol: 'clock.fill', materialIcon: 'access-time-filled' },
    content: <ItemList items={MOCK_ITEMS.slice(-6)} />,
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: { sfSymbol: 'bookmark', materialIcon: 'bookmark-border' },
    activeIcon: { sfSymbol: 'bookmark.fill', materialIcon: 'bookmark' },
    content: <ItemList items={MOCK_ITEMS.filter((i) => i.id % 4 === 0)} />,
  },
];

function InventoryList() {
  return <ScreenContainer scrollable>{useScreenHeaderTabContent()}</ScreenContainer>;
}

const screens: ReadonlyArray<PushScreenConfig<InventoryRoute>> = [
  {
    name: 'InventoryList',
    component: InventoryList,
    header: () => (
      <ScreenHeader variant="tabs" title="Inventory Items" subtitle="Manage stock by category" tabs={TABS} />
    ),
  },
];

export default function InventoryItemsScreen() {
  return <PushNavigator<InventoryRoute> initialRoute="InventoryList" screens={screens} />;
}
