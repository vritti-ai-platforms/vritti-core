import {
  BottomSheet,
  type BottomSheetRef,
} from "@vritti/quantum-ui-native/BottomSheet";
import { useFormatters } from "@vritti/quantum-ui-native/hooks";
import { Text } from "@vritti/quantum-ui-native/Text";
import { forwardRef } from "react";
import { View } from "react-native";
import type { Quant } from "../../../../types/quants";

interface QuantDetailSheetProps {
  // The quant whose details to show, or null before the first open.
  quant: Quant | null;
  // The item's primary UOM symbol — appended to qty values.
  uomSymbol: string | null;
}

// One label/value row of the read-only detail list.
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm text-foreground" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// Read-only quant detail in a bottom sheet (opened by the card's view button). Displays the same data the
// feed already returns — no extra fetch.
export const QuantDetailSheet = forwardRef<BottomSheetRef, QuantDetailSheetProps>(
  ({ quant, uomSymbol }, ref) => {
    const fmt = useFormatters();
    const uom = uomSymbol ? ` ${uomSymbol}` : "";

    return (
      <BottomSheet ref={ref} variant="inline" title="Quant details" detents={["60%"]}>
        <View className="px-4 pb-4">
          {quant ? (
            <>
              <Row label="Location" value={quant.locationName ?? "—"} />
              <Row label="Path" value={quant.locationPath ?? "—"} />
              <Row label="Lot #" value={quant.lotNumber ?? "—"} />
              <Row
                label="Manufacturing Date"
                value={fmt.date(quant.manufacturingDate).primary}
              />
              <Row label="Expiry Date" value={fmt.date(quant.expiryDate).primary} />
              <Row label="Quantity" value={`${quant.quantity}${uom}`} />
              <Row label="Reserved" value={String(quant.reservedQuantity)} />
              <Row label="Available" value={`${quant.availableQuantity}${uom}`} />
              <Row label="Created" value={fmt.dateTime(quant.createdAt).primary} />
            </>
          ) : null}
        </View>
      </BottomSheet>
    );
  },
);

QuantDetailSheet.displayName = "QuantDetailSheet";
