import { NetworkStatus } from '@apollo/client';
import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useConfirm } from '@vritti/quantum-ui-native/hooks';
import { useScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useCostCategories, useDeleteCostCategory, useUpdateCostCategory } from '../../../hooks/cost-categories';
import type { CostCategory } from '../../../types/cost-categories';
import { useCostCategoryCreate } from '../CostCategoryCreateContext';
import { CostCategoryCard } from '../components/CostCategoryCard';
import { CostCategoryFormSheet } from '../forms/CostCategoryFormSheet';

const SEARCH_DEBOUNCE_MS = 300;

// Cost categories list — one card per category (code tile, name, kind + status badges), with a pencil edit
// and an overflow menu (activate/deactivate + delete). Header create (via CostCategoryCreateContext) and a
// card's edit open the same sheet (create vs editing).
export function CostCategoriesList() {
  const { query } = useScreenSearch();
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const { data, previousData, loading, refetch, networkStatus } = useCostCategories(debounced);
  const categories = ((data ?? previousData)?.costCategories ?? []) as CostCategory[];

  // One sheet for create + edit — `editing` null = create.
  const sheetRef = useRef<BottomSheetRef>(null);
  const [editing, setEditing] = useState<CostCategory | null>(null);
  const openCreate = useCallback(() => {
    setEditing(null);
    sheetRef.current?.present();
  }, []);
  const openEdit = (category: CostCategory) => {
    setEditing(category);
    sheetRef.current?.present();
  };

  const { setCreateHandler } = useCostCategoryCreate();
  useEffect(() => {
    setCreateHandler(openCreate);
    return () => setCreateHandler(null);
  }, [openCreate, setCreateHandler]);

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

  const isInitialLoading = loading && networkStatus === NetworkStatus.loading && categories.length === 0;

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={categories}
        isLoading={isInitialLoading}
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
