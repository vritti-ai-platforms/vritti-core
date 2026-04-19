import { Button } from '@vritti/quantum-ui-native/Button';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { Avatar, AvatarFallback, AvatarImage } from '@vritti/quantum-ui-native/Avatar';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { ArrowRight } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import type { LookupOrganization } from '../../services/auth/auth.service';
import { useOrgSelectionStep } from './AuthFlowContext';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { SelectableCard } from './components/SelectableCard';

function orgInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export const OrgSelectionScreen = () => {
  const { email, organizations, goBack, selectOrganization } = useOrgSelectionStep();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selectedOrg = organizations.find((o: LookupOrganization) => o.id === selectedId) ?? null;

  function handleContinue() {
    if (!selectedOrg) return;
    selectOrganization({
      email,
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
      organizationSubdomain: selectedOrg.subdomain,
    });
  }

  return (
    <AuthScreenLayout title="Select your organization" subtitle={email} onBack={goBack}>
      <View className="flex-1">
        <FlashList
          style={{ flex: 1 }}
          data={organizations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SelectableCard
              selected={item.id === selectedId}
              onPress={() => setSelectedId(item.id)}
              leading={
                <Avatar alt={item.name} className="w-10 h-10">
                  {item.logoUrl ? <AvatarImage source={{ uri: item.logoUrl }} /> : null}
                  <AvatarFallback>
                    <Text className="text-xs font-semibold text-muted-foreground">{orgInitials(item.name)}</Text>
                  </AvatarFallback>
                </Avatar>
              }
              title={item.name}
              subtitle={item.subdomain}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        />
      </View>

      <View className="gap-2 pb-8 pt-4">
        {selectedOrg ? (
          <Text className="text-xs text-center text-muted-foreground">Signing in to {selectedOrg.name}</Text>
        ) : null}
        <Button disabled={!selectedId} onPress={handleContinue} className="h-[52px] rounded-xl">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-medium text-primary-foreground">Continue</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </View>
        </Button>
      </View>
    </AuthScreenLayout>
  );
};
