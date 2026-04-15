import * as React from 'react';
import { FlatList, Image, SafeAreaView, View } from 'react-native';
import type { NativeStackScreenProps } from '@vritti/quantum-ui-native/NativeStack';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@vritti/quantum-ui-native/Avatar';
import { PressableCard } from '@vritti/quantum-ui-native/Card';
import { Text } from '@vritti/quantum-ui-native/Typography';
import type { LookupOrganization } from '../services/auth.service';
import type { RootStackParamList } from '../types/navigation';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../assets/vritti-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'OrgSelection'>;

// Returns first two characters of org name as avatar fallback
function orgInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export const OrgSelectionScreen = ({ navigation, route }: Props) => {
  const { email, organizations } = route.params;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selectedOrg = organizations.find((o: LookupOrganization) => o.id === selectedId) ?? null;

  // Navigates to login with selected organization
  function handleContinue() {
    if (!selectedOrg) return;
    navigation.navigate('Login', {
      email,
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
    });
  }

  const renderItem = ({ item }: { item: LookupOrganization }) => {
    const isSelected = item.id === selectedId;

    return (
        <PressableCard
          onPress={() => setSelectedId(item.id)}
          selected={isSelected}
          className={`rounded-2xl p-4 flex-row items-center gap-3 ${isSelected ? '' : 'border border-border bg-card'}`}
        >
          {/* Org avatar */}
          <Avatar alt={item.name} className="w-10 h-10">
            {item.logoUrl ? (
              <AvatarImage source={{ uri: item.logoUrl }} />
            ) : null}
          <AvatarFallback>
            <Text className="text-xs font-semibold text-muted-foreground">
              {orgInitials(item.name)}
            </Text>
          </AvatarFallback>
        </Avatar>

        {/* Center content */}
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-foreground">{item.name}</Text>
          <Text className="text-[13px] text-muted-foreground">{item.subdomain}</Text>
        </View>
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
          Select your organization
        </Text>

        {/* Subtitle */}
        <Text className="text-sm text-muted-foreground text-center mt-2">
          {email}
        </Text>

        {/* Gap */}
        <View className="h-8" />

        {/* Org list */}
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        />

        {/* Spacer */}
        <View className="flex-1" />

        {/* Footer */}
        <View className="gap-2 pb-8 pt-4">
          {selectedOrg && (
            <Text className="text-xs text-center text-muted-foreground">
              Signing in to {selectedOrg.name}
            </Text>
          )}
          <Button
            disabled={!selectedId}
            onPress={handleContinue}
            className="h-[52px] rounded-xl"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-[15px] font-medium text-primary-foreground">Continue</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};
