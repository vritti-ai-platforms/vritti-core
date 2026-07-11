import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import { getSelectedSiteId } from '../../config/storage';
import { usePermissionContext } from '../../providers/PermissionProvider';

// Post-login gate that asks which site to use when the user has more than one, pre-highlighting the last-used site.
export const SiteSelectionScreen = () => {
  const { sites, selectSite } = usePermissionContext();
  const lastUsedSiteId = getSelectedSiteId();

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-3 p-4">
      <Text className="text-sm text-muted-foreground">Choose the workspace you want to work in.</Text>

      <View className="gap-3">
        {sites.map((site) => {
          const isLastUsed = site.id === lastUsedSiteId;
          const meta = [site.code, site.type].filter(Boolean).join(' · ');
          return (
            <CardPressable key={site.id} selected={isLastUsed} onPress={() => selectSite(site.id)} className="gap-1 p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-base font-semibold text-foreground">{site.name}</Text>
                <Text className="text-sm text-muted-foreground">{site.currencyCode}</Text>
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
