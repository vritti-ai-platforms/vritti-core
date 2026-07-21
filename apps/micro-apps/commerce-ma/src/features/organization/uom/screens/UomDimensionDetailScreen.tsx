import type { RouteProp } from '@react-navigation/native';
import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Fab } from '@vritti/quantum-ui-native/Fab';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useCreateEditSheet, useNavigationHeader } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useCallback, useRef } from 'react';
import { RefreshControl, View } from 'react-native';
import { useUomsFeed } from '../../../../hooks/organization/uom';
import { useUomDimension } from '../../../../hooks/organization/uom-dimensions';
import type { Uom } from '../../../../types/uom';
import type { UomDimension } from '../../../../types/uom-dimensions';
import { UomDimensionActionsMenu } from '../components/UomDimensionActionsMenu';
import { UomUnitCard } from '../components/UomUnitCard';
import { UomDimensionFormSheet } from '../forms/UomDimensionFormSheet';
import { UomUnitFormSheet } from '../forms/UomUnitFormSheet';
import type { UomDimensionDetailParams } from '../types';

// Per-dimension detail — the mobile equivalent of the web's right panel: the dimension header (name + a "⋯"
// menu that edits/deletes the DIMENSION) over its list of UNITS (base + derived). Units are created/edited
// in a bottom sheet (FAB / card edit) and deleted with confirm. Dimension read by-id from cache; units via
// the bounded uoms(dimensionId) list.
export function UomDimensionDetail({
  route,
}: {
  route: RouteProp<{ UomDimensionDetail: UomDimensionDetailParams }, 'UomDimensionDetail'>;
}) {
  const id = route.params?.id;

  const { data, loading } = useUomDimension(id);
  const dimension = data?.uomDimension as UomDimension | undefined;

  const feed = useUomsFeed(id ?? '');

  // Dimension edit opens the screen-owned sheet; delete lives in the ⋯ menu component (mutation + goBack).
  const dimensionSheetRef = useRef<BottomSheetRef>(null);

  const openEditDimension = useCallback(() => {
    dimensionSheetRef.current?.present();
  }, []);

  // Header title + "⋯" actions menu, applied pre-paint (no post-render pop-in).
  useNavigationHeader({
    title: dimension?.name,
    right: dimension ? <UomDimensionActionsMenu dimension={dimension} onEdit={openEditDimension} /> : undefined,
  });

  // Unit-level actions: FAB create + per-card edit open the screen-owned sheet; delete is owned by the
  // card (mutation + ActionCard's confirm). Plan-locked create/edit presents the upsell sheet.
  const unitSheet = useCreateEditSheet<Uom>({
    createPermission: ORG_UOM.add,
    editPermission: ORG_UOM.edit,
  });

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
        permission={ORG_UOM.view}
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
        renderItem={({ item }) => <UomUnitCard unit={item} onEdit={unitSheet.openEdit} />}
      />

      <Fab onPress={unitSheet.openCreate} accessibilityLabel="Add unit" permission={ORG_UOM.add} />

      <UomDimensionFormSheet ref={dimensionSheetRef} editing={dimension} />
      <UomUnitFormSheet ref={unitSheet.sheetRef} dimensionId={dimension.id} editing={unitSheet.editing} />
    </View>
  );
}
