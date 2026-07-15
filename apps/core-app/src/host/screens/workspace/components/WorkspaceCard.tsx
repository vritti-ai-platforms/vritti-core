import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import { DynamicIcon, type PlatformIconDescriptor } from '@vritti/quantum-ui-native/DynamicIcon';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CHEVRON_ICON, type ScopeAccent } from '../utils';

interface WorkspaceCardProps {
  accent: ScopeAccent;
  icon: PlatformIconDescriptor;
  index: number;
  onPress: () => void;
  children: ReactNode;
}

// The shared scope-card shell: colored left rail, a large faint watermark of the scope icon, an
// accent icon tile, the content slot, and a trailing chevron. Staggered fade-in on mount.
export const WorkspaceCard = ({ accent, icon, index, onPress, children }: WorkspaceCardProps) => (
  <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
    <CardPressable
      onPress={onPress}
      className="relative flex-row items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 pl-5"
    >
      <View className={`absolute inset-y-0 left-0 w-1 ${accent.rail}`} />

      <View
        pointerEvents="none"
        className="absolute -bottom-6 -right-4"
        style={{ opacity: 0.06, transform: [{ rotate: '-3deg' }] }}
      >
        <DynamicIcon icon={icon} size={120} className={accent.icon} />
      </View>

      <View className={`h-10 w-10 items-center justify-center rounded-lg ${accent.tile}`}>
        <DynamicIcon icon={icon} size={18} className={accent.icon} />
      </View>

      <View className="min-w-0 flex-1">{children}</View>

      <View className="self-center">
        <DynamicIcon icon={CHEVRON_ICON} size={16} className="text-muted-foreground" />
      </View>
    </CardPressable>
  </Animated.View>
);
