import { useQuery } from '@apollo/client/react';
import { type RouteProp, useNavigation } from '@react-navigation/native';
import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Fab } from '@vritti/quantum-ui-native/Fab';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useConfirm, useCreateEditSheet } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { Text } from '@vritti/quantum-ui-native/Text';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { RefreshControl, View } from 'react-native';
import { UOM_DIMENSION_QUERY } from '../../../../graphql/uom-dimensions';
import { useDeleteUom, useUomsFeed } from '../../../../hooks/organization/uom';
import { useDeleteUomDimension } from '../../../../hooks/site/uom-dimensions';
import type { Uom } from '../../../../types/uom';
import type { UomDimension } from '../../../../types/uom-dimensions';
import { UomDimensionActionsMenu } from '../components/UomDimensionActionsMenu';
import { UomUnitCard } from '../components/UomUnitCard';
import { UomDimensionFormSheet } from '../forms/UomDimensionFormSheet';
import { UomUnitFormSheet } from '../forms/UomUnitFormSheet';
import type { UomDimensionDetailParams } from '../types';

const PLUS_ICON = { sfSymbol: 'plus', materialSymbol: 'add' } as const;

// Minimal navigation surface: setOptions (inject the header title + dimension actions menu) + goBack (after
// deleting the dimension). Avoids a @react-navigation/native-stack type dep.
type DetailNavigation = {
  setOptions: (options: { title?: string; headerRight?: () => ReactNode }) => void;
  goBack: () => void;
};

// Per-dimension detail — the mobile equivalent of the web's right panel: the dimension header (name + a "⋯"
// menu that edits/deletes the DIMENSION) over its list of UNITS (base + derived). Units are created/edited
// in a bottom sheet (FAB / card edit) and deleted with confirm. Dimension read by-id from cache; units via
// the bounded uoms(dimensionId) list.
export function UomDimensionDetail({
  route,
}: {
  route: RouteProp<{ UomDimensionDetail: UomDimensionDetailParams }, 'UomDimensionDetail'>;
}) {
  const navigation = useNavigation() as unknown as DetailNavigation;
  const id = route.params?.id;

  const { data, loading } = useQuery(UOM_DIMENSION_QUERY, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const dimension = data?.uomDimension as UomDimension | undefined;

  const feed = useUomsFeed(id ?? '');

  // Dimension-level actions (header menu).
  const [deleteDimension] = useDeleteUomDimension();
  const confirm = useConfirm();
  const dimensionSheetRef = useRef<BottomSheetRef>(null);

  const openEditDimension = useCallback(() => {
    dimensionSheetRef.current?.present();
  }, []);

  const handleDeleteDimension = useCallback(async () => {
    if (!dimension) return;
    const confirmed = await confirm({
      title: `Delete ${dimension.name}?`,
      description: `The "${dimension.name}" dimension will be removed. This can't be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!confirmed) return;
    const result = await deleteDimension({ variables: { id: dimension.id } });
    if (!result.error) navigation.goBack();
  }, [dimension, confirm, deleteDimension, navigation]);

  useEffect(() => {
    if (!dimension) return;
    navigation.setOptions({
      title: dimension.name,
      headerRight: () => (
        <UomDimensionActionsMenu dimension={dimension} onEdit={openEditDimension} onDelete={handleDeleteDimension} />
      ),
    });
  }, [dimension, navigation, openEditDimension, handleDeleteDimension]);

  // Unit-level actions (FAB + per-card edit/delete).
  const [deleteUom] = useDeleteUom();
  const unitSheet = useCreateEditSheet<Uom>();

  const handleDeleteUnit = async (unit: Uom) => {
    const confirmed = await confirm({
      title: `Delete ${unit.name}?`,
      description: `Unit "${unit.name}" (${unit.symbol}) will be removed. This can't be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteUom({ variables: { id: unit.id } });
  };

  if (loading && !dimension) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Spinner size="large" />
      </ScreenContainer>
    );
  }

  if (!dimension) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-base text-muted-foreground">Dimension not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(unit) => unit.id}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View className="py-4">
              <Spinner />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refresh()} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        emptyText={feed.isError ? "Couldn't load units." : 'No units yet. Tap + to add one.'}
        renderItem={({ item }) => <UomUnitCard unit={item} onEdit={unitSheet.openEdit} onDelete={handleDeleteUnit} />}
      />

      <Fab onPress={unitSheet.openCreate} accessibilityLabel="Add unit">
        <DynamicIcon icon={PLUS_ICON} size={24} />
      </Fab>

      <UomDimensionFormSheet ref={dimensionSheetRef} editing={dimension} />
      <UomUnitFormSheet ref={unitSheet.sheetRef} dimensionId={dimension.id} editing={unitSheet.editing} />
    </View>
  );
}
