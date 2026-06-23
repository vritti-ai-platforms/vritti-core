import { Button } from '@vritti/quantum-ui-native/Button';
import { COMMON_ICONS, DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { usePushNavigator } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { Text } from '@vritti/quantum-ui-native/Text';
import { setSelectedDeploymentBaseURL } from '@vritti/quantum-ui-native/utils';
import * as React from 'react';
import { View } from 'react-native';
import { resolveApiBaseUrl } from '../../config/env';
import { useDeployments } from '../../hooks/auth';
import { useAuthFlow } from '../../providers/AuthFlowProvider';
import type { AuthRoute } from '../../routes/auth/authRoutes';
import type { Deployment, DeploymentStatus } from '../../types/deployment';
import { SelectableCard } from './components/SelectableCard';

function dotColorClass(status: DeploymentStatus) {
  if (status === 'active') return 'bg-success';
  if (status === 'provisioning') return 'bg-warning';
  return 'bg-foreground';
}

function orgText(count: number) {
  if (count === 0) return 'No orgs';
  return `${count} org${count === 1 ? '' : 's'}`;
}

export const DeploymentSelectionScreen = () => {
  const { setDeployment } = useAuthFlow();
  const { push } = usePushNavigator<AuthRoute>();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const deploymentsQuery = useDeployments();
  const deployments = deploymentsQuery.data ?? [];

  const selectedDeployment = deployments.find((d) => d.id === selectedId) ?? null;

  async function handleConnect() {
    if (!selectedDeployment) return;
    await setSelectedDeploymentBaseURL(resolveApiBaseUrl(selectedDeployment.url));
    setDeployment(selectedDeployment.url);
    push('EmailLookup');
  }

  return (
    <ScreenContainer className="px-5">
      <Text className="text-xl text-center font-bold">Where would you like to connect?</Text>
      {deploymentsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Spinner size="large" />
          <Text className="text-muted-foreground">Loading deployments…</Text>
        </View>
      ) : deployments.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">No deployments are available right now.</Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlashList
            style={{ flex: 1 }}
            data={deployments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: Deployment }) => {
              const isSelected = item.id === selectedId;
              return (
                <SelectableCard
                  selected={isSelected}
                  onPress={() => setSelectedId(item.id)}
                  leading={<View className={`w-2 h-2 rounded-full ${dotColorClass(item.status)}`} />}
                  title={item.name}
                  subtitle={
                    <View className="flex-row items-center gap-1.5">
                      {item.regionCode ? (
                        <>
                          <Text className="text-[13px] text-muted-foreground">{item.regionCode}</Text>
                          <Text className="text-[13px] text-muted-foreground">·</Text>
                        </>
                      ) : null}
                      <Text className="text-[13px] text-muted-foreground">{orgText(item.organizationCount)}</Text>
                    </View>
                  }
                  trailing={
                    item.cloudProviderCode ? (
                      <View className="bg-muted rounded-md px-2 py-1">
                        <Text className="text-[11px] font-semibold text-muted-foreground">
                          {item.cloudProviderCode.toUpperCase()}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
          />
        </View>
      )}

      <View className="gap-2 pb-8 pt-4">
        {selectedDeployment ? (
          <Text className="text-xs text-center text-muted-foreground">Connecting to {selectedDeployment.name}</Text>
        ) : null}
        <Button disabled={!selectedId} onPress={handleConnect} className="h-[52px] rounded-xl">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-medium text-primary-foreground">Connect</Text>
            <DynamicIcon icon={COMMON_ICONS.arrowForward} size={16} color="#FFFFFF" />
          </View>
        </Button>
      </View>
    </ScreenContainer>
  );
};
