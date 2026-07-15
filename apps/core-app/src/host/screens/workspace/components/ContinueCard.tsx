import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { DynamicIcon, type PlatformIconDescriptor } from '@vritti/quantum-ui-native/DynamicIcon';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ContinueCardProps {
  icon: PlatformIconDescriptor;
  name: string;
  role?: string;
  onPress: () => void;
}

// "Continue where you left off" hero — the last-used workspace, primary-tinted, one tap to resume.
export const ContinueCard = ({ icon, name, role, onPress }: ContinueCardProps) => (
  <Animated.View entering={FadeInDown.duration(400)}>
    <CardPressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4"
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <DynamicIcon icon={icon} size={18} className="text-primary" />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Continue where you left off
        </Text>
        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
          {name}
        </Text>
        {role ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {role}
          </Text>
        ) : null}
      </View>

      <View className="rounded-lg bg-primary px-4 py-2">
        <Text className="text-sm font-semibold text-primary-foreground">Open</Text>
      </View>
    </CardPressable>
  </Animated.View>
);
