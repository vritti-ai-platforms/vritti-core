import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import { getSelectedBusinessUnitId } from '../../config/storage';
import { usePermissionContext } from '../../providers/PermissionProvider';

// Post-login gate (rendered by AppRender, not a nav route): asks which business unit to use
// when the user has more than one. PermissionProvider auto-selects a lone BU, so this never
// shows for single-BU users. The last-used BU (persisted) is pre-highlighted for one-tap
// continue; tapping any card selects it and enters the app.
export const BusinessUnitSelectionScreen = () => {
  const { businessUnits, selectBu } = usePermissionContext();
  const lastUsedBuId = getSelectedBusinessUnitId();

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-3 p-4">
      <Text className="text-sm text-muted-foreground">Choose the workspace you want to work in.</Text>

      <View className="gap-3">
        {businessUnits.map((bu) => {
          const isLastUsed = bu.id === lastUsedBuId;
          const meta = [bu.code, bu.type].filter(Boolean).join(' · ');
          return (
            <CardPressable key={bu.id} selected={isLastUsed} onPress={() => selectBu(bu.id)} className="gap-1 p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-base font-semibold text-foreground">{bu.name}</Text>
                <Text className="text-sm text-muted-foreground">{bu.currencyCode}</Text>
              </View>
              {meta ? <Text className="text-xs text-muted-foreground">{meta}</Text> : null}
              {isLastUsed ? <Text className="text-xs font-medium text-primary">Last used</Text> : null}
            </CardPressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
};
