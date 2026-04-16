import * as React from 'react';
import { FlatList, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '@vritti/quantum-ui-native/Button';
import { PressableCard } from '@vritti/quantum-ui-native/Card';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { setMobileBaseURL } from '@vritti/quantum-ui-native/utils';
import { getDeployments } from '../services/deployment.service';
import type { Deployment, DeploymentStatus } from '../types/deployment';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../../assets/vritti-logo.png');

interface Props {
  onConnected: (deploymentUrl: string) => void;
}

// Maps deployment status to dot color class
function dotColorClass(status: DeploymentStatus) {
  if (status === 'active') return 'bg-success';
  if (status === 'provisioning') return 'bg-warning';
  return 'bg-foreground';
}

// Formats org count text
function orgText(count: number) {
  if (count === 0) return 'No orgs';
  return `${count} org${count === 1 ? '' : 's'}`;
}

export const DeploymentSelectionScreen = ({ onConnected }: Props) => {
  const [deployments, setDeployments] = React.useState<Deployment[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDeployments()
      .then(setDeployments)
      .finally(() => setLoading(false));
  }, []);

  const selectedDeployment = deployments.find((d) => d.id === selectedId) ?? null;

  // Reconfigures axios with deployment URL and navigates to email lookup
  async function handleConnect() {
    if (!selectedDeployment) return;
    await setMobileBaseURL(selectedDeployment.url);
    onConnected(selectedDeployment.url);
  }

  const renderItem = ({ item }: { item: Deployment }) => {
    const isSelected = item.id === selectedId;

    return (
      <PressableCard
        onPress={() => setSelectedId(item.id)}
        selected={isSelected}
        className={`rounded-2xl p-4 flex-row items-center gap-3 ${isSelected ? '' : 'border border-border bg-card'}`}
      >
        {/* Status dot */}
        <View className={`w-2 h-2 rounded-full ${dotColorClass(item.status)}`} />

        {/* Center content */}
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-foreground">{item.name}</Text>
          <View className="flex-row items-center gap-1.5">
            {item.regionCode && (
              <>
                <Text className="text-[13px] text-muted-foreground">{item.regionCode}</Text>
                <Text className="text-[13px] text-muted-foreground">·</Text>
              </>
            )}
            <Text className="text-[13px] text-muted-foreground">{orgText(item.organizationCount)}</Text>
          </View>
        </View>

        {/* Cloud provider badge */}
        {item.cloudProviderCode && (
          <View className="bg-muted rounded-md px-2 py-1">
            <Text className="text-[11px] font-semibold text-muted-foreground">
              {item.cloudProviderCode.toUpperCase()}
            </Text>
          </View>
        )}
      </PressableCard>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5">
        {/* Top spacer */}
        <View className="h-12" />

        {/* Logo */}
        <View className="items-center">
          <Image source={logo} className="w-9 h-9 rounded-lg" resizeMode="contain" />
        </View>

        {/* Gap */}
        <View className="h-6" />

        {/* Title */}
        <Text className="text-xl font-semibold text-foreground text-center">
          Where would you like to connect?
        </Text>

        {/* Gap */}
        <View className="h-8" />

        {/* Deployment list */}
        {loading ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Spinner size="large" />
            <Text className="text-muted-foreground">Loading deployments…</Text>
          </View>
        ) : (
          <FlatList
            data={deployments}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          />
        )}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Footer */}
        <View className="gap-2 pb-8 pt-4">
          {selectedDeployment && (
            <Text className="text-xs text-center text-muted-foreground">
              Connecting to {selectedDeployment.name}
            </Text>
          )}
          <Button
            disabled={!selectedId}
            onPress={handleConnect}
            className="h-[52px] rounded-xl"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-[15px] font-medium text-primary-foreground">Connect</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};
