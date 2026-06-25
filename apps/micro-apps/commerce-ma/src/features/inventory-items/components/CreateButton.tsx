import { useNavigation } from "@react-navigation/native";
import { Button } from "@vritti/quantum-ui-native/Button";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import type { InventoryNavigation } from "../types";

const CREATE_ICON = { sfSymbol: "plus", materialIcon: "add" } as const;

// Inventory list header action — navigates to the create screen.
export function CreateButton() {
  const navigation = useNavigation() as unknown as InventoryNavigation;
  return (
    <Button
      variant="glass"
      size="icon"
      onPress={() => navigation.navigate("InventoryItemCreate")}
      accessibilityLabel="Create item"
      hitSlop={8}
    >
      <DynamicIcon icon={CREATE_ICON} size={24} />
    </Button>
  );
}
