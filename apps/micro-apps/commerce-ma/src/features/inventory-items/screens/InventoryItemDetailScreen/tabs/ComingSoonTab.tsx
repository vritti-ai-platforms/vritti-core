import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { ScreenContainer } from "@vritti/quantum-ui-native/ScreenContainer";
import { Text } from "@vritti/quantum-ui-native/Text";

const CLOCK_ICON = { sfSymbol: "clock", materialSymbol: "schedule" } as const;

// Placeholder for tabs not yet built. Each will be filled in screen-by-screen once its
// core-server GraphQL query + native list screen exist.
export function ComingSoonTab({ label }: { label: string }) {
  return (
    <ScreenContainer className="flex-1 items-center justify-center gap-3 p-6">
      <DynamicIcon icon={CLOCK_ICON} size={32} className="text-muted-foreground" />
      <Text className="text-base font-semibold text-foreground">{label}</Text>
      <Text className="text-sm text-muted-foreground text-center">Coming soon.</Text>
    </ScreenContainer>
  );
}
