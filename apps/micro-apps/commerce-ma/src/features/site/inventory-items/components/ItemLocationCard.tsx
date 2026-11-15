import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Card } from '@vritti/quantum-ui-native/Card';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useUnstableNativeVariable } from 'nativewind';
import { View } from 'react-native';
import type { ItemLocation } from '../../../../types/item-locations';

const PIN_ICON = { sfSymbol: 'mappin', materialSymbol: 'location_on' } as const;
const EDIT_ICON = { sfSymbol: 'pencil', materialSymbol: 'edit' } as const;
const TRASH_ICON = { sfSymbol: 'trash', materialSymbol: 'delete' } as const;

// tsc resolves nativewind's web type for this hook (() => never); at RN runtime it's the native
// (name) => string variant. Cast to the native signature (mirrors CostCategoryCard).
const useThemeVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

interface ItemLocationCardProps {
  location: ItemLocation;
  onEdit?: (location: ItemLocation) => void;
  onDelete?: (location: ItemLocation) => void;
}

// Two-section card: header (location name + pin/path + edit/delete), divider, then the putaway state.
export function ItemLocationCard({ location, onEdit, onDelete }: ItemLocationCardProps) {
  // Blocked = destructive (red), Allowed = success (green). Tint from the resolved theme var (Badge faded fills
  // don't render on these hsl(var()) tokens): faded fill + solid dot/text.
  const statusVar = useThemeVar(location.isBlocked ? '--destructive' : '--success');
  const statusHsl = statusVar ? statusVar.split(' ').join(', ') : undefined;
  const statusColor = statusHsl ? `hsl(${statusHsl})` : undefined;
  const statusBg = statusHsl ? `hsla(${statusHsl}, 0.18)` : undefined;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <View className="flex-row items-center justify-between gap-3 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {location.locationName ?? 'Location'}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <DynamicIcon
              icon={PIN_ICON}
              size={14}
              className="text-muted-foreground"
              style={{ width: 14, height: 14 }}
            />
            <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
              {location.locationPath ?? location.locationName ?? '—'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {onEdit ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-border"
              onPress={() => onEdit(location)}
              accessibilityLabel="Edit location"
              hitSlop={8}
            >
              <DynamicIcon icon={EDIT_ICON} size={14} className="text-foreground" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-sm border border-destructive"
              onPress={() => onDelete(location)}
              accessibilityLabel="Delete location"
              hitSlop={8}
            >
              <DynamicIcon icon={TRASH_ICON} size={14} className="text-destructive" />
            </Button>
          ) : null}
        </View>
      </View>

      <View className="mx-4 h-px bg-border" />

      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Text className="flex-1 text-sm text-muted-foreground">Putaway</Text>
        <Badge variant="secondary" style={statusBg ? { backgroundColor: statusBg } : undefined}>
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={statusColor ? { backgroundColor: statusColor } : undefined}
            />
            <Text className="text-xs font-medium" style={statusColor ? { color: statusColor } : undefined}>
              {location.isBlocked ? 'Blocked' : 'Allowed'}
            </Text>
          </View>
        </Badge>
      </View>
    </Card>
  );
}
