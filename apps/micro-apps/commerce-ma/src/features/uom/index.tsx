import { type RouteProp, useNavigation } from '@react-navigation/native';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenContainer, useScreenScrollY } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_HEIGHT = 110;
const NORMAL_HEIGHT = 80;
const PINNED_HEIGHT = 44;
const HERO_DROP = 60;
const NORMAL_DROP = 50;
const PINNED_AT = HERO_DROP + NORMAL_DROP;

function Header() {
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
          <Text className="text-base font-semibold text-foreground">Units of Measure</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.hero, heroStyle]} pointerEvents="none">
        <Text className="text-[34px] font-bold text-foreground">Units of Measure</Text>
        <Text className="text-sm text-muted-foreground">Manage UOM definitions</Text>
      </Animated.View>
    </Animated.View>
  );
}

type UOMRoute = 'UOMList' | 'UOMDetail';

interface UOMDetailParams {
  id: number;
}

function UOMList() {
  const navigation = useNavigation() as unknown as {
    navigate: (screen: 'UOMDetail', params: UOMDetailParams) => void;
  };

  return (
    <ScreenContainer scrollable>
      <View className="gap-3 p-4">
        {Array.from({ length: 30 }).map((_, i) => {
          const id = i + 1;
          return (
            <Pressable
              key={`uom-${id}`}
              onPress={() => navigation.navigate('UOMDetail', { id })}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <Text className="text-base font-semibold text-foreground">UOM #{id}</Text>
              <Text className="text-sm text-muted-foreground">Placeholder row {id}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

function UOMDetail({ route }: { route: RouteProp<{ UOMDetail: UOMDetailParams }, 'UOMDetail'> }) {
  const id = route.params?.id ?? '?';
  return (
    <ScreenContainer scrollable>
      <View className="p-4 gap-4">
        <Text className="text-2xl font-bold text-foreground">UOM #{id}</Text>
        <Text className="text-base text-muted-foreground">
          Pushed via PushNavigator from the UOM list. Use the back button or swipe right to return.
        </Text>

        <View className="bg-card border border-border rounded-xl p-4 gap-3">
          <View>
            <Text className="text-xs uppercase text-muted-foreground">ID</Text>
            <Text className="text-base font-semibold text-foreground">{id}</Text>
          </View>
          <View>
            <Text className="text-xs uppercase text-muted-foreground">Name</Text>
            <Text className="text-base font-semibold text-foreground">Unit #{id}</Text>
          </View>
          <View>
            <Text className="text-xs uppercase text-muted-foreground">Type</Text>
            <Text className="text-base font-semibold text-foreground">Placeholder</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const screens: ReadonlyArray<PushScreenConfig<UOMRoute>> = [
  { name: 'UOMList', component: UOMList, header: () => <Header /> },
  { name: 'UOMDetail', component: UOMDetail, headerShown: true, title: 'UOM Detail' },
];

export default function UOMScreen() {
  return <PushNavigator<UOMRoute> initialRoute="UOMList" screens={screens} />;
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 2, justifyContent: 'flex-start', flex: 1 },
  compactCenter: { alignItems: 'center', justifyContent: 'center' },
  compactRow: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
