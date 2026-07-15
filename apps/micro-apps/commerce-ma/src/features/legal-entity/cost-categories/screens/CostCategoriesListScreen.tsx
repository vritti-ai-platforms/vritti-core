import { NetworkStatus } from '@apollo/client';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useConfirm, useCreateEditSheet } from '@vritti/quantum-ui-native/hooks';
import { useDebouncedScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { RefreshControl, View } from 'react-native';
import {
  useCostCategories,
  useDeleteCostCategory,
  useUpdateCostCategory,
} from '../../../../hooks/legal-entity/cost-categories';
import type { CostCategory } from '../../../../types/cost-categories';
import { CostCategoryCard } from '../components/CostCategoryCard';
import { CostCategoryFormSheet } from '../forms/CostCategoryFormSheet';

// Cost categories list — one card per category (code tile, name, kind + status badges), with a pencil edit
// and an overflow menu (activate/deactivate + delete). The header create (+) and a card's edit open the same
// sheet (create vs editing).
export function CostCategoriesList() {
  const debounced = useDebouncedScreenSearch();

  const { data, previousData, loading, refetch, networkStatus } = useCostCategories(debounced);
  const categories = ((data ?? previousData)?.costCategories ?? []) as CostCategory[];

  // One sheet for create + edit — `editing` null = create. The header (+) fires openCreate via the registry.
  const { sheetRef, editing, openEdit } = useCreateEditSheet<CostCategory>({ registerCreateAction: true });

  const [updateCategory] = useUpdateCostCategory();
  const [deleteCategory] = useDeleteCostCategory();
  const confirm = useConfirm();

  const handleToggleActive = (category: CostCategory) => {
    updateCategory({ variables: { id: category.id, input: { isActive: !category.isActive } } });
  };
  const handleDelete = async (category: CostCategory) => {
    const confirmed = await confirm({
      title: `Delete "${category.name}"?`,
      description: 'This cost category will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteCategory({ variables: { id: category.id } });
  };

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={categories}
        isLoading={loading}
        skeletonVariant="card"
        keyExtractor={(category) => category.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={networkStatus === NetworkStatus.refetch} onRefresh={() => refetch()} />
        }
        emptyText={debounced ? 'No cost categories match your search.' : 'No cost categories yet.'}
        renderItem={({ item }) => (
          <CostCategoryCard
            category={item}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        )}
      />
      <CostCategoryFormSheet ref={sheetRef} editing={editing} />
    </View>
  );
}
