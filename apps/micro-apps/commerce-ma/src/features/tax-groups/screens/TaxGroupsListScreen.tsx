import { NetworkStatus } from '@apollo/client';
import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useConfirm } from '@vritti/quantum-ui-native/hooks';
import { useScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useDeleteTaxGroup, useTaxGroups } from '../../../hooks/tax-groups';
import type { TaxGroup } from '../../../types/tax-groups';
import { TaxGroupCard } from '../components/TaxGroupCard';
import { TaxGroupFormSheet } from '../forms/TaxGroupFormSheet';
import { useTaxGroupCreate } from '../TaxGroupCreateContext';

const SEARCH_DEBOUNCE_MS = 300;

// Tax groups list — one card per group (rates + total inline), with inline edit/delete. The header create
// button (via TaxGroupCreateContext) and each card's edit action open the same sheet (create vs editing).
export function TaxGroupsList() {
  const { query } = useScreenSearch();
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const { data, previousData, loading, refetch, networkStatus } = useTaxGroups(debounced);
  // Keep the last good list visible while a new search / refetch is in flight (no flash).
  const groups = ((data ?? previousData)?.taxGroups ?? []) as TaxGroup[];

  // One sheet for create + edit — `editing` null = create. (set state then present, like the UOM sheet.)
  const sheetRef = useRef<BottomSheetRef>(null);
  const [editing, setEditing] = useState<TaxGroup | null>(null);
  const openCreate = useCallback(() => {
    setEditing(null);
    sheetRef.current?.present();
  }, []);
  const openEdit = (group: TaxGroup) => {
    setEditing(group);
    sheetRef.current?.present();
  };

  const { setCreateHandler } = useTaxGroupCreate();
  useEffect(() => {
    setCreateHandler(openCreate);
    return () => setCreateHandler(null);
  }, [openCreate, setCreateHandler]);

  const [deleteTaxGroup] = useDeleteTaxGroup();
  const confirm = useConfirm();
  const handleDelete = async (group: TaxGroup) => {
    const confirmed = await confirm({
      title: `Delete "${group.name}"?`,
      description: 'This tax group will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteTaxGroup({ variables: { id: group.id } });
  };

  // Skeletons only on the very first load (no cached/previous data) — a search refetch keeps content on screen.
  const isInitialLoading = loading && networkStatus === NetworkStatus.loading && groups.length === 0;

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={groups}
        isLoading={isInitialLoading}
        skeletonVariant="card"
        keyExtractor={(group) => group.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={networkStatus === NetworkStatus.refetch} onRefresh={() => refetch()} />
        }
        emptyText={debounced ? 'No tax groups match your search.' : 'No tax groups yet.'}
        renderItem={({ item }) => <TaxGroupCard group={item} onEdit={openEdit} onDelete={handleDelete} />}
      />
      <TaxGroupFormSheet ref={sheetRef} editing={editing} />
    </View>
  );
}
