import { ScreenContainer, useScreenScrollY } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_HEIGHT = 110;
const NORMAL_HEIGHT = 80;
const PINNED_HEIGHT = 44;
const HERO_DROP = 60;
const NORMAL_DROP = 50;
const PINNED_AT = HERO_DROP + NORMAL_DROP;

export function Header() {
  const insets = useSafeAreaInsets();
  const scrollY = useScreenScrollY();

  const containerStyle = useAnimatedStyle(() => ({
    height:
      interpolate(
        scrollY.value,
        [0, HERO_DROP, PINNED_AT],
        [HERO_HEIGHT, NORMAL_HEIGHT, PINNED_HEIGHT],
        Extrapolation.CLAMP,
      ) + insets.top,
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_DROP * 0.7], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_DROP], [0, -16], Extrapolation.CLAMP) }],
  }));

  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_DROP, PINNED_AT], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top }, containerStyle]}
      className="bg-background border-b border-border overflow-hidden"
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.compactCenter, { paddingTop: insets.top }, compactStyle]}
        pointerEvents="none"
      >
        <View style={styles.compactRow}>
          <Text className="text-base font-semibold text-foreground">Stock Adjustments</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.hero, heroStyle]} pointerEvents="none">
        <Text className="text-[34px] font-bold text-foreground">Stock Adjustments</Text>
        <Text className="text-sm text-muted-foreground">Manage stock adjustments</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function StockAdjustmentsScreen() {
  return (
    <ScreenContainer scrollable>
      <View className="gap-3 p-4">
        {Array.from({ length: 30 }).map((_, i) => {
          const id = i + 1;
          return (
            <View key={`adjustment-${id}`} className="bg-card border border-border rounded-xl p-4">
              <Text className="text-base font-semibold text-foreground">Adjustment #{id}</Text>
              <Text className="text-sm text-muted-foreground">Placeholder row {id}</Text>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 2, justifyContent: 'flex-start', flex: 1 },
  compactCenter: { alignItems: 'center', justifyContent: 'center' },
  compactRow: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
