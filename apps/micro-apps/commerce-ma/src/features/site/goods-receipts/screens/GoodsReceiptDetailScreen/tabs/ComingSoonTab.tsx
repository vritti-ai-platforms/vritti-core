import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';

const CLOCK_ICON = { sfSymbol: 'clock', materialSymbol: 'schedule' } as const;

// Placeholder for GR detail tabs not yet built (Breakdown, Items Cost). Each will be filled in
// screen-by-screen once its core-server GraphQL query + native content exist.
export function ComingSoonTab({ label }: { label: string }) {
  return (
    <ScreenContainer className="flex-1 items-center justify-center gap-3 p-6">
      <DynamicIcon icon={CLOCK_ICON} size={32} className="text-muted-foreground" />
      <Text className="text-base font-semibold text-foreground">{label}</Text>
      <Text className="text-center text-sm text-muted-foreground">Coming soon.</Text>
    </ScreenContainer>
  );
}
